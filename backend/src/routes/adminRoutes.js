// backend/src/routes/adminRoutes.js

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createGroup,
  getAllGroups,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  getAllUsers
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { validate } = require('../middleware/validationMiddleware');

// All admin routes are protected and require admin privileges
router.use(protect, adminOnly);

// Group validation
const groupValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Group name must be between 3 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];

// User validation
const userValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
];

// Group routes
router.post('/groups', groupValidation, validate, createGroup);
router.get('/groups', getAllGroups);
router.get('/groups/:groupId', getGroupDetails);
router.put('/groups/:groupId', groupValidation, validate, updateGroup);
router.delete('/groups/:groupId', deleteGroup);

// User management in groups
router.post('/groups/:groupId/users', userValidation, validate, addUserToGroup);
router.delete('/groups/:groupId/users/:userId', removeUserFromGroup);

// User management
router.get('/users', getAllUsers);

module.exports = router;