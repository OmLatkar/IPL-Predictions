// backend/src/routes/matchRoutes.js

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createMatch,
  getMatches,
  getMatchById,
  getPendingMatches,
  getCompletedMatches,
  updateMatch,
  deleteMatch
} = require('../controllers/matchController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { IPL_TEAMS } = require('../utils/constants');

// Validation rules
const matchValidation = [
  body('team1')
    .notEmpty()
    .withMessage('Team 1 is required')
    .isIn(IPL_TEAMS)
    .withMessage('Invalid team selected'),
  body('team2')
    .notEmpty()
    .withMessage('Team 2 is required')
    .isIn(IPL_TEAMS)
    .withMessage('Invalid team selected'),
  body('votingDeadline')
    .notEmpty()
    .withMessage('Voting deadline is required')
    .isISO8601()
    .withMessage('Invalid date format')
];

// Routes
router.get('/completed', protect, getCompletedMatches);
router.get('/admin/pending', protect, adminOnly, getPendingMatches);
router.get('/:matchId', protect, getMatchById);
router.get('/', protect, getMatches);

router.post('/', protect, adminOnly, matchValidation, validate, createMatch);
router.put('/:matchId', protect, adminOnly, updateMatch);
router.delete('/:matchId', protect, adminOnly, deleteMatch);

module.exports = router;