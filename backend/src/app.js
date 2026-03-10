// Express app setup - we'll add details later
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes will be added here

module.exports = app;