// backend/src/controllers/pointsController.js

const { PrismaClient } = require('@prisma/client');
const { DateTime } = require('luxon');
const { MATCH_STATUS, POINTS_CONFIG } = require('../utils/constants');
const { calculateMatchPoints } = require('../utils/pointsCalculator');

const prisma = new PrismaClient();

// @desc    Declare winner and distribute points (Admin only)
// @route   POST /api/points/declare-winner/:matchId
// @access  Private/Admin
const declareWinner = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { winningTeam } = req.body;

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        votes: true
      }
    });

    if (!match) {
      return res.status(404).json({
        status: 'error',
        message: 'Match not found'
      });
    }

    // Check if match is pending
    if (match.status !== MATCH_STATUS.PENDING) {
      return res.status(400).json({
        status: 'error',
        message: 'Match already completed'
      });
    }

    // Check if winning team is valid
    if (winningTeam !== match.team1 && winningTeam !== match.team2) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid winning team'
      });
    }

    // Check if voting deadline has passed
    const now = DateTime.now().toUTC();
    const deadline = DateTime.fromJSDate(match.votingDeadline).toUTC();
    
    if (now < deadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Voting deadline has not passed yet'
      });
    }

    // Calculate points for all groups
    const pointsResults = await calculateMatchPoints(prisma, matchId, winningTeam);

    // Store match results and update user points
    const matchResults = [];
    const pointsUpdates = [];

    for (const [groupId, result] of Object.entries(pointsResults)) {
      if (result.hasVotes && !result.distribution.noChange) {
        // Create match result record
        const matchResult = await prisma.matchResult.create({
          data: {
            matchId,
            groupId,
            winnerPoints: result.distribution.pointsPerWinner,
            loserPoints: POINTS_CONFIG.LOSS_PENALTY
          }
        });
        matchResults.push(matchResult);

        // Update points for winners
        for (const winner of result.distribution.winners) {
          pointsUpdates.push(
            prisma.userGroup.update({
              where: {
                userId_groupId: {
                  userId: winner.userId,
                  groupId
                }
              },
              data: {
                points: {
                  increment: winner.pointsChange
                }
              }
            })
          );
        }

        // Update points for losers
        for (const loser of result.distribution.losers) {
          pointsUpdates.push(
            prisma.userGroup.update({
              where: {
                userId_groupId: {
                  userId: loser.userId,
                  groupId
                }
              },
              data: {
                points: {
                  increment: loser.pointsChange // This is negative
                }
              }
            })
          );
        }
      }
    }

    // Execute all points updates in transaction
    await prisma.$transaction(pointsUpdates);

    // Update match status
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: MATCH_STATUS.COMPLETED,
        winningTeam
      }
    });

    // Emit socket events for real-time updates
    const io = req.app.get('io');
    
    // Notify about match completion
    io.emit('match-completed', {
      matchId,
      winningTeam,
      results: matchResults
    });

    // Notify each group about points update
    for (const [groupId, result] of Object.entries(pointsResults)) {
      if (result.hasVotes) {
        io.to(`group:${groupId}`).emit('points-updated', {
          groupId,
          matchId,
          distribution: result.distribution
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        match: updatedMatch,
        results: matchResults,
        pointsDistribution: pointsResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get points table for a group
// @route   GET /api/points/group/:groupId
// @access  Private
const getGroupPointsTable = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if group exists and user is member
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (!userGroup) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group'
      });
    }

    // Get all users in group with their points
    const pointsTable = await prisma.userGroup.findMany({
      where: {
        groupId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isAdmin: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      }
    });

    // Add rank
    const tableWithRank = pointsTable.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user.id,
      username: entry.user.username,
      points: entry.points,
      isCurrentUser: entry.user.id === userId
    }));

    res.status(200).json({
      status: 'success',
      data: {
        groupId,
        pointsTable: tableWithRank
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get points for all groups user belongs to
// @route   GET /api/points/my-groups
// @access  Private
const getMyGroupsPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all groups user belongs to
    const userGroups = await prisma.userGroup.findMany({
      where: {
        userId
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        }
      },
      orderBy: {
        group: {
          name: 'asc'
        }
      }
    });

    // For each group, get top few users (optional)
    const groupsWithPoints = await Promise.all(
      userGroups.map(async (ug) => {
        const topUsers = await prisma.userGroup.findMany({
          where: {
            groupId: ug.groupId
          },
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: {
            points: 'desc'
          },
          take: 5 // Get top 5
        });

        return {
          group: ug.group,
          userPoints: ug.points,
          rank: topUsers.findIndex(u => u.userId === userId) + 1,
          totalMembers: await prisma.userGroup.count({
            where: { groupId: ug.groupId }
          }),
          topUsers: topUsers.map((u, index) => ({
            rank: index + 1,
            username: u.user.username,
            points: u.points
          }))
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        groups: groupsWithPoints
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get match results for a group
// @route   GET /api/points/match-results/:groupId
// @access  Private
const getMatchResults = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is in group
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (!userGroup) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a member of this group'
      });
    }

    // Get all match results for this group
    const matchResults = await prisma.matchResult.findMany({
      where: {
        groupId
      },
      include: {
        match: {
          select: {
            id: true,
            team1: true,
            team2: true,
            winningTeam: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        calculatedAt: 'desc'
      }
    });

    // For each match, get user's vote
    const resultsWithUserVote = await Promise.all(
      matchResults.map(async (result) => {
        const userVote = await prisma.vote.findUnique({
          where: {
            userId_matchId: {
              userId,
              matchId: result.matchId
            }
          },
          select: {
            selectedTeam: true
          }
        });

        return {
          ...result,
          userVote: userVote?.selectedTeam || null
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        groupId,
        matchResults: resultsWithUserVote
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get global leaderboard (all groups)
// @route   GET /api/points/global-leaderboard
// @access  Private/Admin
const getGlobalLeaderboard = async (req, res, next) => {
  try {
    // Only admin can see global leaderboard
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    // Get all users with their total points across groups
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        userGroups: {
          select: {
            points: true,
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Calculate total points per user
    const leaderboard = users.map(user => ({
      userId: user.id,
      username: user.username,
      totalPoints: user.userGroups.reduce((sum, ug) => sum + ug.points, 0),
      groups: user.userGroups.map(ug => ({
        groupId: ug.group.id,
        groupName: ug.group.name,
        points: ug.points
      }))
    }));

    // Sort by total points
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: rankedLeaderboard
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  declareWinner,
  getGroupPointsTable,
  getMyGroupsPoints,
  getMatchResults,
  getGlobalLeaderboard
};