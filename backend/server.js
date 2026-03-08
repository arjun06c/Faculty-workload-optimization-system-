require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const connectDB = require('./config/db');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

const app = express();

// Database Connection
connectDB();

const path = require('path');

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.post('/api/login', require('./controllers/authController').loginUser);
app.post('/api/google-login', require('./controllers/authController').googleLogin);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/academics', require('./routes/academicsRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));

// Handle undefined routes
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
