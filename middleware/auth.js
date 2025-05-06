const jwt = require('jsonwebtoken');
const db = require('../config/db_connection');

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    const [user] = await db.query(
      'SELECT * FROM user_detail WHERE user_id = ? AND status = 1',
      [req.user.userId]
    );

    if (!user.length || user[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check if user owns the resource
exports.isOwner = async (req, res, next) => {
  try {
    const resourceId = req.params.userId || req.params.orderId;
    const [resource] = await db.query(
      'SELECT user_id FROM user_detail WHERE user_id = ?',
      [resourceId]
    );

    if (!resource.length || resource[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this resource.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to validate request body
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

// Middleware to handle rate limiting
exports.rateLimiter = (req, res, next) => {
  // Implement rate limiting logic here
  // For example, using express-rate-limit package
  next();
};

// Middleware to log requests
exports.requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

// Middleware to handle errors
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
}; 