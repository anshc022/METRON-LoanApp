const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../utils/token.util');

// sign up a new user
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;

    // Validate role
    if (!['admin', 'agent'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "admin" or "agent"'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      location: role === 'agent' ? location : null,
    });

    // Don't send password in response
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      created_at: user.created_at
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: err.message
    });
  }
};

// login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    // Return user data along with token
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      created_at: user.created_at
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: userData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: err.message
    });
  }
};

// verify token
exports.verify = async (req, res) => {
  // If middleware passed, token is valid
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      id: req.user.id,
      role: req.user.role
    }
  });
};