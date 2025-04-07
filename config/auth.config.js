module.exports = {
    secret: process.env.JWT_SECRET || 'himanshuisdev',
    expiresIn: '1d', // token expiry
  };
  