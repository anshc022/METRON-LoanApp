// app.js
const express = require('express');
const { sequelize } = require('./models');
require('dotenv').config();
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');




const app = express();
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

sequelize.sync({ alter: true }) // or { force: true } during testing
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('DB sync failed:', err);
  });

module.exports = app;
