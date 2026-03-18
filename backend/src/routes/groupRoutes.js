// backend/src/routes/groupRoutes.js

const express = require('express');
const router = express.Router();

const {
  getAllGroups,
  getGroupById
} = require('../controllers/groupController');

const { protect } = require('../middleware/authMiddleware');

// Routes
router.get('/', getAllGroups);
router.get('/:groupId', protect, getGroupById);

module.exports = router;