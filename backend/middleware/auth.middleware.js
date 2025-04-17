// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.verifyToken = async (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    req.user = user; 
    next();
  } catch (err) {
    console.error('verifyToken error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};
