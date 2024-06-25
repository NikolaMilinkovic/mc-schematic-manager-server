const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const sendEmail = require('../../utils/email');
const User = require('../../models/user');
const generateToken = require('../../utils/generateToken.js');
require('dotenv').config();

router.patch('/', async(req, res) => {
  try{
    console.log(req.body.email);

    const user = await User.findOne({ email: req.body.email })
    if(!user) {
      return res.status(404).json({
        message: 'Email not found, please check your email and try again.'
      });
    } else {
      const resetToken = generateToken();
      user.passwordResetToken = resetToken;
      await user.save();


      // SEND THE TOKEN TO THE USER EMAIL
      // console.log(req.get('host'));
      // const resetUrl = `${req.protocol}://${req.get('host')}/new-password/${resetToken}`;
      // const refererUrl = req.get('Referer');
      // const referer = new URL(refererUrl);

      const resetUrl = `${referer.protocol}//${process.env.FRONT_DOMAIN}/set-new-password/${resetToken}`;
      const message = `We have received a password reset request. Please use the below link to reset your password.\n\n
      ${resetUrl}`;



      try{
        await sendEmail({
          email: user.email,
          subject: 'Password change request',
          message: message
        });

        return res.status(200).json({
          message: 'Password reset link sent to the user email!'
        })

      } catch(err){
        user.passwordResetToken = undefined;
        await user.save();
        return console.error(`There was an error sending password reset email.`, err)
      }

    }

  } catch(err) {
    res.status(500).json({ message: 'Error resetting password.' });
    console.error('There was an error while reseting the users password.', err);
  }
});

module.exports = router;