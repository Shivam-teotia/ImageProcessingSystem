const express = require('express');
const connectDB = require('./config/db');
const uploadRoutes = require('./routes/uploadRoute');
const statusRoutes = require('./routes/statusRoute');
const webhookRoutes = require('./routes/webhookRoute');

const app = express();

// Middleware
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api', uploadRoutes);
app.use('/api', statusRoutes);
app.use('/api', webhookRoutes);

module.exports = app;
