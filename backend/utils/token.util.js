const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

exports.generateToken = (payload) => {
  return jwt.sign(payload, authConfig.secret, {
    expiresIn: authConfig.jwtExpiration,
    issuer: authConfig.tokenIssuer,
    audience: authConfig.tokenAudience
  });
};

exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, authConfig.secret, {
    expiresIn: authConfig.jwtRefreshExpiration,
    issuer: authConfig.tokenIssuer,
    audience: authConfig.tokenAudience
  });
};

exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, authConfig.secret, {
      issuer: authConfig.tokenIssuer,
      audience: authConfig.tokenAudience
    });
    return {
      valid: true,
      expired: false,
      decoded
    };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      decoded: null
    };
  }
};

exports.decodeToken = (token) => {
  return jwt.decode(token);
};