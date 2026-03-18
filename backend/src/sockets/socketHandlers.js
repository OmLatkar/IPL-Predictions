// backend/src/sockets/socketHandlers.js

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Authenticate user and join their personal room
    socket.on('authenticate', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their private room`);
    });

    // Join match room for real-time vote updates
    socket.on('join-match', (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`Socket ${socket.id} joined match ${matchId}`);
    });

    // Leave match room
    socket.on('leave-match', (matchId) => {
      socket.leave(`match:${matchId}`);
      console.log(`Socket ${socket.id} left match ${matchId}`);
    });

    // Join group room for group-specific updates
    socket.on('join-group', (groupId) => {
      socket.join(`group:${groupId}`);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    });

    // Leave group room
    socket.on('leave-group', (groupId) => {
      socket.leave(`group:${groupId}`);
      console.log(`Socket ${socket.id} left group ${groupId}`);
    });

    // Join tournament room for global announcements
    socket.on('join-tournament', () => {
      socket.join('tournament');
      console.log(`Socket ${socket.id} joined tournament room`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Helper functions to emit events
  const emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  const emitToMatch = (matchId, event, data) => {
    io.to(`match:${matchId}`).emit(event, data);
  };

  const emitToGroup = (groupId, event, data) => {
    io.to(`group:${groupId}`).emit(event, data);
  };

  const emitToTournament = (event, data) => {
    io.to('tournament').emit(event, data);
  };

  const emitToAll = (event, data) => {
    io.emit(event, data);
  };

  return {
    emitToUser,
    emitToMatch,
    emitToGroup,
    emitToTournament,
    emitToAll
  };
};

module.exports = { setupSocketHandlers };