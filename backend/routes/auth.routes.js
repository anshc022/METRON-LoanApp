const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rate-limit.middleware');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.get('/verify', verifyToken, authController.verify);

module.exports = router;