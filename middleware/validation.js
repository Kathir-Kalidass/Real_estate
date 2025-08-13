const { body, validationResult } = require('express-validator');

// User registration validation
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim()
    .escape(),
  
  body('role')
    .isIn(['buyer', 'owner'])
    .withMessage('Role must be either buyer or owner'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Property creation/update validation
const validateProperty = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .trim()
    .escape(),
  
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim()
    .escape(),
  
  body('location')
    .isLength({ min: 5, max: 255 })
    .withMessage('Location must be between 5 and 255 characters')
    .trim()
    .escape(),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('propertyType')
    .isIn(['house', 'apartment', 'condo', 'land', 'commercial'])
    .withMessage('Invalid property type'),
  
  body('bedrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bedrooms must be a number between 0 and 20'),
  
  body('bathrooms')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Bathrooms must be a number between 0 and 20'),
  
  body('areaSqft')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Area must be a positive number')
];

// Chat message validation
const validateMessage = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim()
    .escape()
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(err => err.msg).join(', '));
    return res.redirect('back');
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProperty,
  validateMessage,
  handleValidationErrors
};
