// backend/src/controllers/voteController.js

const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { DateTime } = require('luxon');
const { MATCH_STATUS } = require('../utils/constants');

const prisma = new PrismaClient();

// @desc    Cast or update vote
// @route   POST /api/votes
// @access  Private
const castVote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { matchId, selectedTeam } = req.body;
    const userId = req.user.id;

    // Check if match exists and is pending
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({
        status: 'error',
        message: 'Match not found'
      });
    }

    // Check if match is still pending
    if (match.status !== MATCH_STATUS.PENDING) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot vote on completed match'
      });
    }

    // Check if voting deadline hasn't passed
    const now = DateTime.now().toUTC();
    const deadline = DateTime.fromJSDate(match.votingDeadline).toUTC();
    
    if (now >= deadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Voting deadline has passed'
      });
    }

    // Check if selected team is valid (must be one of the playing teams)
    if (selectedTeam !== match.team1 && selectedTeam !== match.team2) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid team selection'
      });
    }

    // Upsert vote (create or update)
    const vote = await prisma.vote.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId
        }
      },
      update: {
        selectedTeam
      },
      create: {
        userId,
        matchId,
        selectedTeam
      }
    });

    // Get updated vote counts for this match
    const voteCounts = await prisma.vote.groupBy({
      by: ['selectedTeam'],
      where: {
        matchId
      },
      _count: true
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('vote-update', {
      matchId,
      voteCounts: voteCounts.map(v => ({
        team: v.selectedTeam,
        count: v._count
      }))
    });

    res.status(200).json({
      status: 'success',
      data: {
        vote
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's vote for a match
// @route   GET /api/votes/match/:matchId
// @access  Private
const getMyVote = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const vote = await prisma.vote.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId
        }
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        vote: vote || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all votes for a match (after deadline)
// @route   GET /api/votes/match/:matchId/all
// @access  Private
const getMatchVotes = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({
        status: 'error',
        message: 'Match not found'
      });
    }

    // Check if voting deadline has passed or match is completed
    const now = DateTime.now().toUTC();
    const deadline = DateTime.fromJSDate(match.votingDeadline).toUTC();
    
    if (now < deadline && match.status === MATCH_STATUS.PENDING) {
      return res.status(403).json({
        status: 'error',
        message: 'Votes are hidden until deadline passes'
      });
    }

    // Get user's groups
    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const groupIds = userGroups.map(ug => ug.groupId);

    // Get all votes with user info (but only from user's groups)
    const votes = await prisma.vote.findMany({
      where: {
        matchId,
        user: {
          userGroups: {
            some: {
              groupId: {
                in: groupIds
              }
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            userGroups: {
              where: {
                groupId: {
                  in: groupIds
                }
              },
              select: {
                groupId: true,
                group: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Group votes by team and group
    const votesByGroup = {};
    groupIds.forEach(groupId => {
      votesByGroup[groupId] = {
        team1: { count: 0, users: [] },
        team2: { count: 0, users: [] }
      };
    });

    votes.forEach(vote => {
      const userGroups = vote.user.userGroups;
      userGroups.forEach(ug => {
        if (votesByGroup[ug.groupId]) {
          const teamKey = vote.selectedTeam === match.team1 ? 'team1' : 'team2';
          votesByGroup[ug.groupId][teamKey].count++;
          votesByGroup[ug.groupId][teamKey].users.push({
            id: vote.user.id,
            username: vote.user.username
          });
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: {
        match: {
          id: match.id,
          team1: match.team1,
          team2: match.team2
        },
        votes: votesByGroup
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel my vote
// @route   DELETE /api/votes/match/:matchId
// @access  Private
const cancelVote = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    // Check if match exists and is pending
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({
        status: 'error',
        message: 'Match not found'
      });
    }

    if (match.status !== MATCH_STATUS.PENDING) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel vote for completed match'
      });
    }

    // Check if deadline hasn't passed
    const now = DateTime.now().toUTC();
    const deadline = DateTime.fromJSDate(match.votingDeadline).toUTC();
    
    if (now >= deadline) {
      return res.status(400).json({
        status: 'error',
        message: 'Voting deadline has passed'
      });
    }

    // Delete vote
    await prisma.vote.delete({
      where: {
        userId_matchId: {
          userId,
          matchId
        }
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('vote-cancelled', {
      matchId,
      userId
    });

    res.status(200).json({
      status: 'success',
      message: 'Vote cancelled successfully'
    });
  } catch (error) {
    // If vote doesn't exist, that's fine
    if (error.code === 'P2025') {
      return res.status(200).json({
        status: 'success',
        message: 'No vote to cancel'
      });
    }
    next(error);
  }
};

module.exports = {
  castVote,
  getMyVote,
  getMatchVotes,
  cancelVote
};