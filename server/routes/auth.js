const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// Register a new user
router.post('/register', authController.register);

// Confirm registration
router.get('/confirm/:token', authController.confirmRegistration);

// Login
router.post('/login', authController.login);

// Validate token (protected route)
router.get('/validate', authMiddleware, authController.validateToken);

module.exports = router;
