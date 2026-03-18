// backend/src/routes/tournamentRoutes.js

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  startTournament,
  endTournament,
  resetTournament,
  getTournamentStatus,
  getTournamentSummary
} = require('../controllers/tournamentController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { validate } = require('../middleware/validationMiddleware');

// Public route for tournament summary (after tournament ends)
router.get('/summary', getTournamentSummary);

// Admin only routes
router.use(protect, adminOnly);

router.post('/start', startTournament);
router.post('/end', endTournament);
router.post('/reset', [
  body('confirm')
    .equals('RESET_TOURNAMENT')
    .withMessage('Please confirm with "RESET_TOURNAMENT"')
], validate, resetTournament);
router.get('/status', getTournamentStatus);

module.exports = router;