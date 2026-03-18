// backend/src/routes/pointsRoutes.js

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  declareWinner,
  getGroupPointsTable,
  getMyGroupsPoints,
  getMatchResults,
  getGlobalLeaderboard
} = require('../controllers/pointsController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { validate } = require('../middleware/validationMiddleware');

// Validation rules
const winnerDeclarationValidation = [
  body('winningTeam')
    .notEmpty()
    .withMessage('Winning team is required')
];

// Routes
router.get('/my-groups', protect, getMyGroupsPoints);
router.get('/group/:groupId', protect, getGroupPointsTable);
router.get('/match-results/:groupId', protect, getMatchResults);
router.get('/global-leaderboard', protect, adminOnly, getGlobalLeaderboard);

router.post(
  '/declare-winner/:matchId',
  protect,
  adminOnly,
  winnerDeclarationValidation,
  validate,
  declareWinner
);

module.exports = router;