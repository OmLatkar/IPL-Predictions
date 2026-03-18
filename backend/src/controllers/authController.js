// backend/src/controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { DEFAULT_ADMIN_USERNAME } = require('../utils/constants');

const prisma = new PrismaClient();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { username, password, groupIds } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username already exists'
      });
    }

    // Check if this is the first user (will be admin)
    const userCount = await prisma.user.count();
    const isAdmin = userCount === 0 || username === DEFAULT_ADMIN_USERNAME;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin,
        // If groupIds provided, add user to groups
        ...(groupIds && groupIds.length > 0 && {
          userGroups: {
            create: groupIds.map(groupId => ({
              groupId,
              points: 0
            }))
          }
        })
      },
      include: {
        userGroups: {
          include: {
            group: true
          }
        }
      }
    });

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userGroups: {
          include: {
            group: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // User is already available from auth middleware
    const { password: _, ...userWithoutPassword } = req.user;
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join groups
// @route   POST /api/auth/join-groups
// @access  Private
const joinGroups = async (req, res, next) => {
  try {
    const { groupIds } = req.body;
    const userId = req.user.id;

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of group IDs'
      });
    }

    // Check if groups exist and are active
    const groups = await prisma.group.findMany({
      where: {
        id: { in: groupIds },
        isActive: true
      }
    });

    if (groups.length !== groupIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more groups do not exist or are not active'
      });
    }

    // Add user to groups (skip if already a member)
    for (const groupId of groupIds) {
      await prisma.userGroup.upsert({
        where: {
          userId_groupId: {
            userId,
            groupId
          }
        },
        update: {}, // No update if exists
        create: {
          userId,
          groupId,
          points: 0
        }
      });
    }

    // Get updated user with groups
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGroups: {
          include: {
            group: true
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave group
// @route   DELETE /api/auth/leave-group/:groupId
// @access  Private
const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is in group
    const userGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (!userGroup) {
      return res.status(404).json({
        status: 'error',
        message: 'You are not a member of this group'
      });
    }

    // Remove user from group
    await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully left the group'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  joinGroups,
  leaveGroup
};