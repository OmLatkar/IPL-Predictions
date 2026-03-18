// backend/src/middleware/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'A record with this value already exists.'
      });
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Record not found.'
      });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token.'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };