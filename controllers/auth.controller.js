const bcrypt = require('bcryptjs');

const { User } = require('../models');
const { generateToken } = require('../utils/token.util');

// sign up a new user
exports.signup = async (req, res) => {
    try {
      const { name, email, password, role, location } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        location: role === 'agent' ? location : null,
      });
  
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
      res.status(500).json({ message: 'Signup failed', error: err.message });
    }
  };


// login user
exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  
      const token = generateToken({ id: user.id, role: user.role });
  
      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  };