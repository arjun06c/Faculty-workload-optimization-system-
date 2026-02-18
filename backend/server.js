require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const connectDB = require('./config/db');

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/academics', require('./routes/academicsRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
