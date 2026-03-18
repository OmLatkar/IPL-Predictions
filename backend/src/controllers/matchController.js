// backend/src/controllers/matchController.js

const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { DateTime } = require('luxon');
const { IPL_TEAMS, MATCH_STATUS, ADMIN_TIMEZONE } = require('../utils/constants');

const prisma = new PrismaClient();

// @desc    Create a new match (Admin only)
// @route   POST /api/matches
// @access  Private/Admin
const createMatch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { team1, team2, votingDeadline } = req.body;

    // Validate teams are different
    if (team1 === team2) {
      return res.status(400).json({
        status: 'error',
        message: 'Both teams must be different'
      });
    }

    // Validate teams are in IPL_TEAMS
    if (!IPL_TEAMS.includes(team1) || !IPL_TEAMS.includes(team2)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid team selected'
      });
    }

    // Convert deadline from admin's timezone to UTC
    const adminTimezone = ADMIN_TIMEZONE;
    const deadlineInAdminTZ = DateTime.fromISO(votingDeadline, { zone: adminTimezone });
    
    if (!deadlineInAdminTZ.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid deadline format'
      });
    }

    // Check if deadline is in future
    if (deadlineInAdminTZ < DateTime.now().setZone(adminTimezone)) {
      return res.status(400).json({
        status: 'error',
        message: 'Voting deadline must be in the future'
      });
    }

    // Convert to UTC for storage
    const deadlineUTC = deadlineInAdminTZ.toUTC().toJSDate();

    // Create match
    const match = await prisma.match.create({
      data: {
        team1,
        team2,
        votingDeadline: deadlineUTC,
        status: MATCH_STATUS.PENDING
      }
    });

    // Emit socket event for new match
    const io = req.app.get('io');
    io.emit('new-match', match);

    res.status(201).json({
      status: 'success',
      data: {
        match
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all matches (with filters)
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res, next) => {
  try {
    const { status, groupId } = req.query;
    const userId = req.user.id;

    // Build filter
    const where = {};
    if (status) {
      where.status = status;
    }

    // Get matches
    const matches = await prisma.match.findMany({
      where,
      include: {
        votes: {
          where: {
            userId
          },
          select: {
            selectedTeam: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add voting status and deadline info
    const now = DateTime.now().toUTC();
    const matchesWithStatus = matches.map(match => {
      const deadline = DateTime.fromJSDate(match.votingDeadline).toUTC();
      const isVotingOpen = now < deadline && match.status === MATCH_STATUS.PENDING;
      
      return {
        ...match,
        votingDeadline: deadline.toISO(),
        isVotingOpen,
        timeRemaining: isVotingOpen ? deadline.diff(now).toMillis() : 0,
        userVote: match.votes[0]?.selectedTeam || null,
        totalVotes: match._count.votes
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        matches: matchesWithStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get match by ID
// @route   GET /api/matches/:matchId
// @access  Private
const getMatchById = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        votes: {
          where: {
            userId
          },
          select: {
            selectedTeam: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        status: 'error',
        message: 'Match not found'
      });
    }

    // Add voting status
    const now = DateTime.now().toUTC();
    const deadline = DateTime.fromJSDate(match.votingDeadline).toUTC();
    const isVotingOpen = now < deadline && match.status === MATCH_STATUS.PENDING;

    res.status(200).json({
      status: 'success',
      data: {
        match: {
          ...match,
          votingDeadline: deadline.toISO(),
          isVotingOpen,
          timeRemaining: isVotingOpen ? deadline.diff(now).toMillis() : 0,
          userVote: match.votes[0]?.selectedTeam || null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending matches (for admin to declare winner)
// @route   GET /api/matches/admin/pending
// @access  Private/Admin
const getPendingMatches = async (req, res, next) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: MATCH_STATUS.PENDING,
        votingDeadline: {
          lt: new Date() // Deadline passed
        }
      },
      include: {
        _count: {
          select: { votes: true }
        }
      },
      orderBy: {
        votingDeadline: 'asc'
      }
    });

    // Add vote counts per team
    const matchesWithVoteCounts = await Promise.all(
      matches.map(async (match) => {
        const votes = await prisma.vote.groupBy({
          by: ['selectedTeam'],
          where: {
            matchId: match.id
          },
          _count: true
        });

        const voteCounts = {};
        votes.forEach(v => {
          voteCounts[v.selectedTeam] = v._count;
        });

        return {
          ...match,
          voteCounts,
          totalVotes: match._count.votes
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        matches: matchesWithVoteCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get completed matches (for history)
// @route   GET /api/matches/completed
// @access  Private
const getCompletedMatches = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.query;

    const where = {
      status: MATCH_STATUS.COMPLETED
    };

    const matches = await prisma.match.findMany({
      where,
      include: {
        votes: {
          where: {
            userId
          },
          select: {
            selectedTeam: true
          }
        },
        matchResults: groupId ? {
          where: {
            groupId
          }
        } : true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        matches: matches.map(match => ({
          id: match.id,
          team1: match.team1,
          team2: match.team2,
          winningTeam: match.winningTeam,
          userVote: match.votes[0]?.selectedTeam || null,
          results: match.matchResults,
          completedAt: match.updatedAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match (Admin only)
// @route   PUT /api/matches/:matchId
// @access  Private/Admin
const updateMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { team1, team2, votingDeadline } = req.body;

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

    // Only allow updates if match is still pending
    if (match.status !== MATCH_STATUS.PENDING) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update completed match'
      });
    }

    const updateData = {};

    if (team1) {
      if (!IPL_TEAMS.includes(team1)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid team1'
        });
      }
      updateData.team1 = team1;
    }

    if (team2) {
      if (!IPL_TEAMS.includes(team2)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid team2'
        });
      }
      updateData.team2 = team2;
    }

    if (votingDeadline) {
      // Convert deadline
      const deadlineInAdminTZ = DateTime.fromISO(votingDeadline, { zone: ADMIN_TIMEZONE });
      if (!deadlineInAdminTZ.isValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid deadline format'
        });
      }
      updateData.votingDeadline = deadlineInAdminTZ.toUTC().toJSDate();
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emit('match-updated', updatedMatch);

    res.status(200).json({
      status: 'success',
      data: {
        match: updatedMatch
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete match (Admin only)
// @route   DELETE /api/matches/:matchId
// @access  Private/Admin
const deleteMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;

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

    // Only allow deletion if match is pending
    if (match.status !== MATCH_STATUS.PENDING) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete completed match'
      });
    }

    // Delete match (cascade will delete votes)
    await prisma.match.delete({
      where: { id: matchId }
    });

    // Emit socket event
    const io = req.app.get('io');
    io.emit('match-deleted', matchId);

    res.status(200).json({
      status: 'success',
      message: 'Match deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMatch,
  getMatches,
  getMatchById,
  getPendingMatches,
  getCompletedMatches,
  updateMatch,
  deleteMatch
};