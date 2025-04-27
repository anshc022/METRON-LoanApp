// app.js
const express = require('express');
const { sequelize } = require('./models');
const cors = require('cors');
require('dotenv').config();
const formatResponse = require('./middleware/response.middleware');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter, authLimiter, collectionLimiter } = require('./middleware/rate-limit.middleware');
const { validateApiKey } = require('./middleware/api-key.middleware');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const agentRoutes = require('./routes/agent.routes');

const app = express();

// Configure CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:3000',  // React (my-app)
    'http://localhost:5173',  // Vite (project)
    'http://127.0.0.1:5173', // Vite alternative URL
    'http://localhost:3001'   // Vite (clint)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY']
}));

// Increase JSON payload limit and enable body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add response formatting middleware
app.use(formatResponse);

// Root route to show API status
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Loan Management API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      agent: '/api/agent'
    },
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting
app.use('/api', apiLimiter); // General rate limiting for all API routes
app.use('/api/auth', authLimiter); // Stricter rate limiting for auth routes
app.use('/api/admin/create-collection', collectionLimiter); // Rate limiting for admin collection creation
app.use('/api/agent/create-collection', collectionLimiter); // Rate limiting for agent collection creation

// API key validation for third-party integration routes
app.use('/api/integration', validateApiKey);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', apiLimiter, validateApiKey, adminRoutes);
app.use('/api/agent', apiLimiter, validateApiKey, agentRoutes);

// Error handling middleware should be last
app.use(errorHandler);

// Sync database
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('DB sync failed:', err);
  });

module.exports = app;
