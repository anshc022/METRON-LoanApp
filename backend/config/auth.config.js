require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: 24 * 60 * 60, // 24 hours
  jwtRefreshExpiration: 7 * 24 * 60 * 60, // 7 days
  saltRounds: 10, // for bcrypt
  passwordMinLength: 8,
  passwordMaxLength: 100,
  passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/, // At least 1 uppercase, 1 lowercase, 1 number
  tokenIssuer: 'loan-management-system',
  tokenAudience: 'loan-management-app'
};
