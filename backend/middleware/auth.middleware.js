// middleware/auth.middleware.js
const { verifyToken } = require('../utils/token.util');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const tokenValidation = verifyToken(token);

  if (!tokenValidation.valid) {
    if (tokenValidation.expired) {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        expired: true
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Set decoded user info in request
  req.user = tokenValidation.decoded;
  next();
};
