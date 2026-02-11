const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/authController');
const { auth, checkRole } = require('../middleware/authMiddleware');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   POST api/auth/register
// @desc    Register a new user (Admin only for now, or initial setup)
// @access  Public (or Admin only)
router.post('/register', registerUser);

module.exports = router;
