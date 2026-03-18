// backend/server.js

const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = require('./src/app');
const { setupSocketHandlers } = require('./src/sockets/socketHandlers');
const { createVotingScheduler } = require('./src/sockets/votingScheduler');

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Setup socket handlers
setupSocketHandlers(io);

// Store io instance in app for use in controllers
app.set('io', io);

// Voting deadline scheduler (emits voting-closed)
const votingScheduler = createVotingScheduler({ io, prisma: app.get('prisma') });
app.set('votingScheduler', votingScheduler);
votingScheduler.scheduleAllPending().catch((err) => {
  console.error('Failed to schedule pending voting deadlines', err);
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});