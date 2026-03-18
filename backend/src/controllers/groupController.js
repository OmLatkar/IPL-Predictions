// backend/src/controllers/groupController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get all active groups
// @route   GET /api/groups
// @access  Public
const getAllGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: { userGroups: true }
        }
      },
      orderBy: {
        name: 'asc'
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

// @desc    Get group by ID
// @route   GET /api/groups/:groupId
// @access  Private
const getGroupById = async (req, res, next) => {
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
                isAdmin: true
              }
            }
          },
          orderBy: {
            points: 'desc'
          }
        },
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

module.exports = {
  getAllGroups,
  getGroupById
};