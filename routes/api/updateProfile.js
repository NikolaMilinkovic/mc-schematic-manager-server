const express = require('express');
const { uploadToCloudinary, removeFromCloudinary } = require('../../services/cloudinary');
const router = express.Router();
const { ObjectId } = require('mongodb');
const multer = require('multer');
const upload = multer();
const { body, check, validationResult } = require('express-validator');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');


router.post('/',
  upload.single('avatar'),
  [
    // body('id').notEmpty().withMessage('Id is required').escape(),
    // body('username').notEmpty().withMessage('Username is required').escape(),
    // body('email').notEmpty().withMessage('Email is required').escape(),
    // body('studio_name').notEmpty().withMessage('Studio_name is required').escape(),
  ],
  async(req, res) => {
    // Validation of input
    const errors = validationResult(req)
    if (!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() })
    }

    try{
    // =========================[EXTRACT DATA]=========================
      const { avatar, id, username, email, studio_name, new_password, old_password } = req.body;
      console.log('> Updating user profile.')
      // console.log(`ID: ${id}`)
      // console.log(`Username: ${username}`)
      // console.log(`Email: ${email}`)
      // console.log(`Studio_name: ${studio_name}`)
      // console.log(`New_password: ${new_password}`)
    // =========================[\EXTRACT DATA]=========================
      // FIND USER IN DB
      const user = await User.findOne({ _id: id });


      const hashedPassword = await bcrypt.hash('smor', 10);

      console.log('Logging password')
      console.log(hashedPassword)
      // HANDLE USERNAME UPDATE
      if(username !== user.username){
        const findDuplicate = await User.findOne({ username: username });
        if(findDuplicate){
          return res.status(400).json({ message: 'This username is already taken, please provide a different username!' });
        } else {
          user.username = username;
          console.log(`> Updated username to ${username}`);
        }
      }

      // HANDLE EMAIL UPDATE
      if(email !== user.email){
        const findDuplicate = await User.findOne({ email: email });
        if(findDuplicate){
          return res.status(400).json({ message: 'This email is already registered, please provide a different email!' });
        } else {
          user.email = email;
          console.log(`> Updated email to ${email}`);
        }
      }

      // HANDLE PASSWORD UPDATE
      if(old_password.trim()){
        const match = await bcrypt.compare(old_password, user.password);
        if (match) {
          const hashedPassword = await bcrypt.hash(new_password, 10);
          user.password = hashedPassword;
          console.log(hashedPassword);
          console.log(`> Updated password to ${hashedPassword}`);
        } else {
          return res.status(400).json({ message: 'Invalid password. Please try again.' });
        }
      }

      // HANDLE STUDIO NAME UPDATE
      if(studio_name !== user.studio.name){
        user.studio.name = studio_name;
        console.log(`> Updated studio name to ${studio_name}`);
      }

      // HANDLE AVATAR UPDATE
      if (avatar) {
        let imageData = {}
        await removeFromCloudinary(user.avatar.publicId);
        const results = await uploadToCloudinary(avatar, "mc-schematic-manager-images")
        imageData = results
        user.avatar = imageData;
        console.log(`> Updated avatar to url: ${imageData.url}`);
      }

      await user.save();
      res.status(200).json({ message: 'User updated successfuly!', status: 200 });
    } catch(err){
      console.log(err)
      res.status(500).json({ message: 'Error while updating the profile', status: 500 });
    }
  }
)

module.exports = router;