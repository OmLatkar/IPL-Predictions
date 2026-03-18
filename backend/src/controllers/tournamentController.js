// backend/src/controllers/tournamentController.js

const { PrismaClient } = require('@prisma/client');
const { DateTime } = require('luxon');
const { MATCH_STATUS, TOURNAMENT_STATE } = require('../utils/constants');

const prisma = new PrismaClient();

// @desc    Start tournament
// @route   POST /api/admin/tournament/start
// @access  Private/Admin
const startTournament = async (req, res, next) => {
  try {
    // Check if tournament is already active
    const activeGroups = await prisma.group.count({
      where: { isActive: true }
    });

    // You can store tournament state in a settings table if needed
    // For now, we'll use groups' isActive flag

    // Activate all groups (in case some were deactivated)
    await prisma.group.updateMany({
      where: { isActive: false },
      data: { isActive: true }
    });

    // Log tournament start (optional - you can create a Tournament model later)
    console.log(`Tournament started at ${DateTime.now().toISO()}`);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('tournament-started', {
      message: 'Tournament has started!',
      timestamp: DateTime.now().toISO()
    });

    res.status(200).json({
      status: 'success',
      message: 'Tournament started successfully',
      data: {
        startedAt: DateTime.now().toISO(),
        state: TOURNAMENT_STATE.ACTIVE
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End tournament
// @route   POST /api/admin/tournament/end
// @access  Private/Admin
const endTournament = async (req, res, next) => {
  try {
    // Check for any pending matches
    const pendingMatches = await prisma.match.count({
      where: { 
        status: MATCH_STATUS.PENDING,
        votingDeadline: {
          lt: new Date() // Deadline passed
        }
      }
    });

    if (pendingMatches > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot end tournament. ${pendingMatches} match(es) pending winner declaration.`
      });
    }

    // Deactivate all groups
    await prisma.group.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Log tournament end
    console.log(`Tournament ended at ${DateTime.now().toISO()}`);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('tournament-ended', {
      message: 'Tournament has ended!',
      timestamp: DateTime.now().toISO()
    });

    res.status(200).json({
      status: 'success',
      message: 'Tournament ended successfully',
      data: {
        endedAt: DateTime.now().toISO(),
        state: TOURNAMENT_STATE.ENDED
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset tournament (clear all data and start fresh)
// @route   POST /api/admin/tournament/reset
// @access  Private/Admin
const resetTournament = async (req, res, next) => {
  try {
    const { confirm } = req.body;

    if (!confirm || confirm !== 'RESET_TOURNAMENT') {
      return res.status(400).json({
        status: 'error',
        message: 'Please confirm with "RESET_TOURNAMENT" to proceed with reset'
      });
    }

    // Use transaction to delete all tournament data
    await prisma.$transaction([
      // Delete all match results
      prisma.matchResult.deleteMany({}),
      
      // Delete all votes
      prisma.vote.deleteMany({}),
      
      // Delete all matches
      prisma.match.deleteMany({}),
      
      // Reset all user points to 0 (but keep users in groups)
      prisma.userGroup.updateMany({
        data: { points: 0 }
      }),
      
      // Reactivate all groups
      prisma.group.updateMany({
        data: { isActive: true }
      })
    ]);

    // Log tournament reset
    console.log(`Tournament reset at ${DateTime.now().toISO()}`);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('tournament-reset', {
      message: 'Tournament has been reset!',
      timestamp: DateTime.now().toISO()
    });

    res.status(200).json({
      status: 'success',
      message: 'Tournament reset successfully. All matches and votes cleared.',
      data: {
        resetAt: DateTime.now().toISO()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament status
// @route   GET /api/admin/tournament/status
// @access  Private/Admin
const getTournamentStatus = async (req, res, next) => {
  try {
    // Get counts for various entities
    const [
      totalGroups,
      activeGroups,
      totalUsers,
      totalMatches,
      pendingMatches,
      completedMatches,
      totalVotes
    ] = await Promise.all([
      prisma.group.count(),
      prisma.group.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: MATCH_STATUS.PENDING } }),
      prisma.match.count({ where: { status: MATCH_STATUS.COMPLETED } }),
      prisma.vote.count()
    ]);

    // Get upcoming matches (next 5)
    const upcomingMatches = await prisma.match.findMany({
      where: {
        status: MATCH_STATUS.PENDING,
        votingDeadline: {
          gt: new Date()
        }
      },
      orderBy: {
        votingDeadline: 'asc'
      },
      take: 5,
      select: {
        id: true,
        team1: true,
        team2: true,
        votingDeadline: true
      }
    });

    // Get pending winner declarations
    const pendingWinnerDeclarations = await prisma.match.count({
      where: {
        status: MATCH_STATUS.PENDING,
        votingDeadline: {
          lt: new Date()
        }
      }
    });

    // Get top groups by activity (most votes)
    const activeGroups_ = await prisma.group.findMany({
      take: 5,
      include: {
        _count: {
          select: { 
            userGroups: true,
            matchResults: true
          }
        }
      },
      orderBy: {
        matchResults: {
          _count: 'desc'
        }
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        tournamentState: activeGroups > 0 ? TOURNAMENT_STATE.ACTIVE : TOURNAMENT_STATE.ENDED,
        stats: {
          totalGroups,
          activeGroups,
          totalUsers,
          totalMatches,
          pendingMatches,
          completedMatches,
          totalVotes,
          pendingWinnerDeclarations
        },
        upcomingMatches,
        mostActiveGroups: activeGroups_.map(g => ({
          id: g.id,
          name: g.name,
          memberCount: g._count.userGroups,
          matchesPlayed: g._count.matchResults
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tournament summary (for final display)
// @route   GET /api/tournament/summary
// @access  Public (after tournament ends)
const getTournamentSummary = async (req, res, next) => {
  try {
    // Check if tournament has ended (no active groups)
    const activeGroups = await prisma.group.count({
      where: { isActive: true }
    });

    if (activeGroups > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Tournament is still active. Summary available after tournament ends.'
      });
    }

    // Get all groups with final standings
    const groups = await prisma.group.findMany({
      include: {
        userGroups: {
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
          }
        },
        _count: {
          select: {
            matchResults: true
          }
        }
      }
    });

    // Format group standings
    const groupStandings = groups.map(group => ({
      groupId: group.id,
      groupName: group.name,
      totalMatches: group._count.matchResults,
      standings: group.userGroups.map((ug, index) => ({
        rank: index + 1,
        userId: ug.user.id,
        username: ug.user.username,
        points: ug.points
      }))
    }));

    // Get overall tournament stats
    const [
      totalMatches,
      totalVotes,
      mostVotedMatch,
      biggestWinner
    ] = await Promise.all([
      prisma.match.count({ where: { status: MATCH_STATUS.COMPLETED } }),
      prisma.vote.count(),
      // Most voted match
      prisma.match.findFirst({
        where: { status: MATCH_STATUS.COMPLETED },
        include: {
          _count: {
            select: { votes: true }
          }
        },
        orderBy: {
          votes: {
            _count: 'desc'
          }
        }
      }),
      // User with most points across all groups
      prisma.user.findFirst({
        include: {
          userGroups: true
        }
      })
    ]);

    // Calculate biggest winner (user with highest total points)
    const users = await prisma.user.findMany({
      include: {
        userGroups: true
      }
    });

    const userTotalPoints = users.map(user => ({
      userId: user.id,
      username: user.username,
      totalPoints: user.userGroups.reduce((sum, ug) => sum + ug.points, 0)
    }));

    userTotalPoints.sort((a, b) => b.totalPoints - a.totalPoints);
    const biggestWinner_ = userTotalPoints[0];

    res.status(200).json({
      status: 'success',
      data: {
        tournamentEnded: true,
        summary: {
          totalMatches,
          totalVotes,
          mostVotedMatch: mostVotedMatch ? {
            id: mostVotedMatch.id,
            team1: mostVotedMatch.team1,
            team2: mostVotedMatch.team2,
            votes: mostVotedMatch._count.votes
          } : null,
          biggestWinner: biggestWinner_,
          groupStandings
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startTournament,
  endTournament,
  resetTournament,
  getTournamentStatus,
  getTournamentSummary
};