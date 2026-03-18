// backend/src/utils/pointsCalculator.js

const { POINTS_CONFIG } = require('./constants');

/**
 * Calculate points distribution for a match in a specific group
 * @param {Array} votes - All votes for this match in this group
 * @param {string} winningTeam - The team that won the match
 * @returns {Object} - Points distribution details
 */
const calculatePointsDistribution = (votes, winningTeam) => {
  const { LOSS_PENALTY, DECIMAL_PLACES } = POINTS_CONFIG;

  // Separate winners and losers
  const winners = votes.filter(v => v.selectedTeam === winningTeam);
  const losers = votes.filter(v => v.selectedTeam !== winningTeam);

  // If everyone voted same way or no votes, no points change
  if (winners.length === 0 || losers.length === 0) {
    return {
      winners: [],
      losers: [],
      pointsPerWinner: 0,
      totalPointsDistributed: 0,
      noChange: true
    };
  }

  // Calculate points
  const totalLostPoints = losers.length * LOSS_PENALTY;
  const pointsPerWinner = Number((totalLostPoints / winners.length).toFixed(DECIMAL_PLACES));

  // Prepare distribution details
  const winnerDetails = winners.map(v => ({
    userId: v.userId,
    pointsChange: pointsPerWinner
  }));

  const loserDetails = losers.map(v => ({
    userId: v.userId,
    pointsChange: -LOSS_PENALTY
  }));

  return {
    winners: winnerDetails,
    losers: loserDetails,
    pointsPerWinner,
    totalPointsDistributed: totalLostPoints,
    noChange: false
  };
};

/**
 * Calculate points for all groups for a match
 * @param {Object} prisma - Prisma client instance
 * @param {string} matchId - Match ID
 * @param {string} winningTeam - Winning team
 * @returns {Object} - Points calculation results per group
 */
const calculateMatchPoints = async (prisma, matchId, winningTeam) => {
  // Get all groups
  const groups = await prisma.group.findMany({
    where: { isActive: true },
    select: { id: true }
  });

  const results = {};

  // For each group, calculate points
  for (const group of groups) {
    // Get all votes from users in this group for this match
    const votes = await prisma.vote.findMany({
      where: {
        matchId,
        user: {
          userGroups: {
            some: {
              groupId: group.id
            }
          }
        }
      },
      include: {
        user: {
          include: {
            userGroups: {
              where: {
                groupId: group.id
              }
            }
          }
        }
      }
    });

    // If no votes in this group, skip
    if (votes.length === 0) {
      results[group.id] = {
        hasVotes: false,
        distribution: null
      };
      continue;
    }

    // Calculate distribution for this group
    const distribution = calculatePointsDistribution(votes, winningTeam);
    
    results[group.id] = {
      hasVotes: true,
      distribution,
      totalVotes: votes.length,
      winnerCount: distribution.winners.length,
      loserCount: distribution.losers.length
    };
  }

  return results;
};

module.exports = {
  calculatePointsDistribution,
  calculateMatchPoints
};