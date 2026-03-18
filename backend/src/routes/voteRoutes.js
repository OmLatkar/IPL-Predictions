// backend/src/routes/voteRoutes.js

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  castVote,
  getMyVote,
  getMatchVotes,
  cancelVote
} = require('../controllers/voteController');

const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

// Validation rules
const voteValidation = [
  body('matchId')
    .notEmpty()
    .withMessage('Match ID is required'),
  body('selectedTeam')
    .notEmpty()
    .withMessage('Selected team is required')
];

// Routes
router.post('/', protect, voteValidation, validate, castVote);
router.get('/match/:matchId', protect, getMyVote);
router.get('/match/:matchId/all', protect, getMatchVotes);
router.delete('/match/:matchId', protect, cancelVote);

module.exports = router;