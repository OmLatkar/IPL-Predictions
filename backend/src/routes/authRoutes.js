// backend/src/routes/authRoutes.js

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  getMe,
  joinGroups,
  leaveGroup
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('groupIds')
    .optional()
    .isArray()
    .withMessage('groupIds must be an array')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/join-groups', protect, joinGroups);
router.delete('/leave-group/:groupId', protect, leaveGroup);

module.exports = router;