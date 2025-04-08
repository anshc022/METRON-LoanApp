// app.js
const express = require('express');
const { sequelize } = require('./models');
require('dotenv').config();
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const agentRoutes = require('./routes/agent.routes');



const app = express();
app.use(express.json());

// routes
app.use('/api/auth', authRoutes); //auth route for all  
app.use('/api/admin', adminRoutes); // only admin routes  
app.use('/api/agent', agentRoutes); // only agent routes

sequelize.sync({ alter: true }) // or { force: true } during testing
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('DB sync failed:', err);
  });

module.exports = app;
