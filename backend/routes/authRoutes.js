const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full Name is required'),

  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], authController.register);

router.post('/login', authController.login);

module.exports = router;
