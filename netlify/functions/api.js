const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a minimal Express app for Netlify Functions
const app = express();

// Add CORS for Netlify
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/.netlify/functions/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'OZi Backend is running on Netlify',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API endpoint
app.get('/.netlify/functions/api', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'OZi Backend API is accessible',
    timestamp: new Date().toISOString()
  });
});

// Export the serverless function
exports.handler = serverless(app);
