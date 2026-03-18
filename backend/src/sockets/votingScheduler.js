// backend/src/sockets/votingScheduler.js

const { MATCH_STATUS } = require('../utils/constants');

const MAX_TIMEOUT_MS = 2 ** 31 - 1; // setTimeout max (~24.8 days)

function createVotingScheduler({ io, prisma }) {
  const timers = new Map(); // matchId -> timeout

  const clearTimer = (matchId) => {
    const t = timers.get(matchId);
    if (t) clearTimeout(t);
    timers.delete(matchId);
  };

  const emitVotingClosed = (matchId) => {
    io.emit('voting-closed', { matchId });
  };

  const scheduleVotingClosed = (match) => {
    if (!match?.id || !match?.votingDeadline) return;
    if (match.status !== MATCH_STATUS.PENDING) return;

    clearTimer(match.id);

    const deadlineMs = new Date(match.votingDeadline).getTime();
    const nowMs = Date.now();
    const delay = Math.max(0, deadlineMs - nowMs);

    if (delay === 0) {
      emitVotingClosed(match.id);
      return;
    }

    if (delay > MAX_TIMEOUT_MS) {
      // Too far in the future for one timer; re-schedule later.
      const t = setTimeout(() => scheduleVotingClosed(match), MAX_TIMEOUT_MS);
      timers.set(match.id, t);
      return;
    }

    const t = setTimeout(() => {
      emitVotingClosed(match.id);
      clearTimer(match.id);
    }, delay);

    timers.set(match.id, t);
  };

  const scheduleAllPending = async () => {
    const matches = await prisma.match.findMany({
      where: {
        status: MATCH_STATUS.PENDING,
        votingDeadline: { gt: new Date() },
      },
      select: { id: true, votingDeadline: true, status: true },
    });

    matches.forEach(scheduleVotingClosed);
  };

  return {
    scheduleVotingClosed,
    scheduleAllPending,
    clearTimer,
  };
}

module.exports = { createVotingScheduler };

