const express = require('express');
const router = express.Router();
const { body , validationResult } = require('express-validator');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');

router.post('/',
  [
    body('username').notEmpty().withMessage('Username is required!').escape(),
    body('email').notEmpty().withMessage('Email is required!').escape()
  ],
  async(req, res) => {
    try {
      const data = req.body;
      if(!data || !data.username || !data.email || !data.password){
        return res.status(404).json({ message: 'Missing data from signup form.' });
      }

      const existingUsername = await User.findOne({ username: data.username });
      if(existingUsername){
        return res.status(409).json({ message: "Username is already in use. Please choose a different username." });
      }

      const existingEmail = await User.findOne({ email: data.email });
      if(existingEmail){
        console.log('EMAIL IN USE RETURNING ERROR.')
        return res.status(409).json({ message: "Email is already in use." });
      }
  
      if (!existingUsername && !existingEmail) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
  
        const newUser = new User({
          username: data.username,
          email: data.email,
          password: hashedPassword,
          role: 'owner',
          session_id: 'test_session_id',
        });
  
        await newUser.save();
        return res.status(200).json({ message: "Registration successful! Please Log in to continue." })

      } else {
        return res.status(409).json({ message: "Username or email is already in use. Please choose a different username or email." });
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }
)

module.exports = router;