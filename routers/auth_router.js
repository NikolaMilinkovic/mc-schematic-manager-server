const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const authController = require('../controllers/auth/authController');
const authModule = require('../authModule');

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required!').escape(),
    body('email').notEmpty().withMessage('Email is required!').escape(),
    body('password').notEmpty().withMessage('Password is required!'),
    body('studio_name').optional().isString().trim().escape(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authController.register
);

/**
 * POST /auth/login
 * Login with email (strong user) or username (weak user)
 */
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Email or username is required').escape(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  passport.authenticate('local', { session: false }),
  authController.login
);

/**
 * GET /auth/protected
 * Check if user is authenticated with JWT
 */
router.get(
  '/protected',
  authModule.authenticateJWT,
  authController.protected
);

/**
 * POST /auth/logout
 * Logout user
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * PATCH /auth/password-reset
 * Request password reset - sends email with reset link
 */
router.patch(
  '/password-reset',
  authController.requestPasswordReset
);

/**
 * PATCH /auth/new-password/:token
 * Set new password using reset token
 */
router.patch(
  '/new-password/:token',
  authController.setNewPassword
);

module.exports = router;
