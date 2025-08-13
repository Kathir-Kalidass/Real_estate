const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middleware/validation');
const { redirectIfAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Registration page
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('auth/register', { 
    title: 'Register',
    errors: [],
    formData: {}
  });
});

// Registration process
router.post('/register', 
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password, fullName, role, phone } = req.body;

      // Check if user already exists
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user into database
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, passwordHash, role, fullName, phone]
      );

      res.json({
        success: true,
        message: 'Registration successful! Please log in.',
        user: {
          id: result.insertId,
          username,
          email,
          role,
          fullName
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }
);

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', { 
    title: 'Login',
    errors: []
  });
});

// Login process
router.post('/login',
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const [users] = await db.execute(
        'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Create session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      };

      res.json({
        success: true,
        message: `Welcome back, ${user.full_name || user.username}!`,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.full_name
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Profile page
router.get('/profile', (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in to view your profile');
    return res.redirect('/auth/login');
  }

  res.render('auth/profile', {
    title: 'My Profile',
    user: req.session.user
  });
});

module.exports = router;
