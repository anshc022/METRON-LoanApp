const rateLimit = require('express-rate-limit');

// Whitelist for development IPs
const whitelist = ['127.0.0.1', 'localhost', '::1'];

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return process.env.NODE_ENV === 'development' && whitelist.includes(ip);
  }
});

// More lenient limiter for auth endpoints
exports.authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15)
  max: 20, // limit each IP to 20 login attempts per 5 minutes (increased from 10)
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return process.env.NODE_ENV === 'development' && whitelist.includes(ip);
  }
});

// Collection creation limiter
exports.collectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 collection creations per minute
  message: {
    success: false,
    message: 'Too many collection attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return process.env.NODE_ENV === 'development' && whitelist.includes(ip);
  }
});