const User = require('../../models/user');
const Studio = require('../../models/studio');
const bcrypt = require('bcryptjs');
const sendEmail = require('../../utils/email');
const generateToken = require('../../utils/generateToken');
const authModule = require('../../authModule');

/**
 * Register a new user (strong user - owner)
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.username || !data.email || !data.password) {
      return res.status(404).json({ message: 'Missing data from signup form.' });
    }

    const normalizedEmail = String(data.email).trim().toLowerCase();
    const studioName = String(data.studio_name || normalizedEmail).trim();

    if (!studioName) {
      return res.status(400).json({ message: 'Studio name cannot be empty.' });
    }

    const existingUsername = await User.findOne({ username: data.username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username is already in use. Please choose a different username." });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      console.log('EMAIL IN USE RETURNING ERROR.')
      return res.status(409).json({ message: "Email is already in use." });
    }

    if (!existingUsername && !existingEmail) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const newUser = new User({
        username: data.username,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'owner',
        session_id: 'test_session_id',
      });

      await newUser.save();

      try {
        const studio = new Studio({
          name: studioName,
          owner_user_id: newUser._id,
          members: [newUser._id],
        });

        await studio.save();
      } catch (studioError) {
        await User.findByIdAndDelete(newUser._id);
        console.error('Error creating studio during registration:', studioError);
        return res.status(500).json({ message: 'Registration failed while creating studio.' });
      }

      return res.status(200).json({
        message: "Registration successful! Please Log in to continue.",
        studio_name: studioName,
      })

    } else {
      return res.status(409).json({ message: "Username or email is already in use. Please choose a different username or email." });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Error during registration.' });
  }
};

/**
 * Login handler - delegates to passport and then to authModule.loginHandler
 * POST /auth/login
 * Handled by passport middleware in router
 */
const login = (req, res) => {
  // This is called after passport authentication succeeds
  authModule.loginHandler(req, res);
};

/**
 * Check if user is authenticated
 * GET /auth/protected
 */
const protected = (req, res) => {
  res.json({ message: "You are authenticated", user: req.user });
};

/**
 * Logout handler
 * POST /auth/logout
 */
const logout = (req, res) => {
  authModule.logoutHandler(req, res);
};

/**
 * Request password reset - sends reset email to user
 * PATCH /auth/password-reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    console.log(req.body.email);

    const user = await User.findOne({ email: req.body.email })
    if (!user) {
      return res.status(404).json({
        message: 'Email not found, please check your email and try again.'
      });
    } else {
      const resetToken = generateToken();
      user.passwordResetToken = resetToken;
      await user.save();

      // SEND THE TOKEN TO THE USER EMAIL
      const refererUrl = req.get('Referer');
      const referer = new URL(refererUrl);

      const resetUrl = `${referer.protocol}//${process.env.FRONT_DOMAIN}/set-new-password/${resetToken}`;
      const message = `We have received a password reset request. Please use the below link to reset your password.\n\n
      ${resetUrl}`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Password change request',
          message: message
        });

        return res.status(200).json({
          message: 'Password reset link sent to the user email!'
        })

      } catch (err) {
        user.passwordResetToken = undefined;
        await user.save();
        console.error(`There was an error sending password reset email.`, err);
        return res.status(500).json({ message: 'Error sending reset email.' });
      }

    }

  } catch (err) {
    res.status(500).json({ message: 'Error resetting password.' });
    console.error('There was an error while reseting the users password.', err);
  }
};

/**
 * Set new password using reset token
 * PATCH /auth/new-password/:token
 */
const setNewPassword = async (req, res) => {
  try {
    const resetToken = req.params.token;
    const password = req.body.password;
    console.log('Reset token:', resetToken);
    console.log('Password is: ', password);
    const user = await User.findOne({ passwordResetToken: resetToken });

    if (!user) {
      return res.status(404).json({ message: 'Error updating the password! User with this token is not present in the database.' });
    }

    // HANDLE PASSWORD UPDATE
    if (password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      console.log(`> Updated password to ${hashedPassword}`);
    }

    await user.save();

    res.status(200).json({ message: 'Password successfully updated!' });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting password.' });
    console.error('Error setting new password.', err);
  }
};

module.exports = {
  register,
  login,
  protected,
  logout,
  requestPasswordReset,
  setNewPassword,
};
