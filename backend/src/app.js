// backend/src/app.js

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Import routes (comment out ones that don't exist yet)
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const matchRoutes = require('./routes/matchRoutes');
const voteRoutes = require('./routes/voteRoutes');
const pointsRoutes = require('./routes/pointsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorMiddleware');

// Initialize express
const app = express();

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Make prisma available to routes
app.set('prisma', prisma);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tournament', tournamentRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot find ${req.originalUrl} on this server`
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;