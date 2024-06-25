const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/user');

router.patch('/:token', async (req, res) => {
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
});

module.exports = router;
