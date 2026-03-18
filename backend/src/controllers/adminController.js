// backend/src/controllers/adminController.js

const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();

// @desc    Create a new group
// @route   POST /api/admin/groups
// @access  Private/Admin
const createGroup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    // Check if group with same name exists
    const existingGroup = await prisma.group.findUnique({
      where: { name }
    });

    if (existingGroup) {
      return res.status(400).json({
        status: 'error',
        message: 'Group with this name already exists'
      });
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        isActive: true
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        group
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups (admin view)
// @route   GET /api/admin/groups
// @access  Private/Admin
const getAllGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { userGroups: true }
        },
        userGroups: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isAdmin: true
              }
            }
          },
          orderBy: {
            points: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        groups
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group details
// @route   GET /api/admin/groups/:groupId
// @access  Private/Admin
const getGroupDetails = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        userGroups: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isAdmin: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            points: 'desc'
          }
        },
        matchResults: {
          include: {
            match: true
          },
          orderBy: {
            calculatedAt: 'desc'
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        group
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group
// @route   PUT /api/admin/groups/:groupId
// @access  Private/Admin
const updateGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { name, description, isActive } = req.body;

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // If name is being changed, check if new name is available
    if (name && name !== group.name) {
      const existingGroup = await prisma.group.findUnique({
        where: { name }
      });
      if (existingGroup) {
        return res.status(400).json({
          status: 'error',
          message: 'Group with this name already exists'
        });
      }
    }

    // Update group
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name || group.name,
        description: description !== undefined ? description : group.description,
        isActive: isActive !== undefined ? isActive : group.isActive
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        group: updatedGroup
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete group
// @route   DELETE /api/admin/groups/:groupId
// @access  Private/Admin
const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { userGroups: true }
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Delete group (cascade will delete userGroups and matchResults)
    await prisma.group.delete({
      where: { id: groupId }
    });

    res.status(200).json({
      status: 'success',
      message: 'Group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add user to group
// @route   POST /api/admin/groups/:groupId/users
// @access  Private/Admin
const addUserToGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Add user to group
    const userGroup = await prisma.userGroup.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      },
      update: {},
      create: {
        userId,
        groupId,
        points: 0
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'User added to group successfully',
      data: {
        userGroup
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove user from group
// @route   DELETE /api/admin/groups/:groupId/users/:userId
// @access  Private/Admin
const removeUserFromGroup = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;

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
        message: 'User is not a member of this group'
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
      message: 'User removed from group successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (for admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: { userGroups: true }
        },
        userGroups: {
          include: {
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  getAllUsers
};