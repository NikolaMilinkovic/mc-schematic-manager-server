const express = require('express');
const multer = require('multer');
const router = express.Router();
const User = require('../../../models/user')
const Collection = require('../../../models/collection')
const { uploadToCloudinary } = require('../../../services/cloudinary');
const path = require('path');
// const path = require('path');
// const fs = require('fs');
// const puppeteer = require('puppeteer');
// const router = express.Router();
// const Tags = require('../../models/tags');
// const Schematic = require('../../models/schematic');
// require('dotenv').config();
// const { getFAWEString } = require('../../FAWE_string');
// const { body, validationResult } = require('express-validator');
// const User = require('../../models/user');

const upload = multer();
router.post('/', 
  upload.single('avatar'),
  [
    // body('tags').notEmpty().withMessage('Tags are required!'),
    // body('schematicName').notEmpty().withMessage('Schematic name is required!').escape()
  ],
  async (req, res) => {
    try{
      const currentUser = req.user;
      const avatar = req.body.avatar
      const collectionName = req.body.collection_name;
      const collectionTags = req.body.collection_tags;
  
      // Handle different users
      let user;
      if(currentUser.role === 'owner'){
        console.log('> User is OWNER')
        user = await User.findOne({ _id: currentUser._id });
      } 
      if(currentUser.role === 'studio_user'){
        console.log('> User is STUDIO_USER')
        user = await User.findOne({ _id: currentUser.parent_user_id });
      }

      // Add tags into Tags Arr
      const tagArr = collectionTags.split(',').map(tag => tag.trim());
      const newTags = tagArr.filter(tag => !user.collection_tags.includes(tag));
      if(newTags.length > 0){
        newTags.forEach(tag => {
          user.collection_tags.push(tag);
        });
      }
      console.log('> Added New Tags')
      console.log(newTags)
      console.log(user.collection_tags)
      // HANDLE AVATAR UPDATE

      let imageData = {}
      if (avatar) {
        console.log('> Avatar found, uploading to cloudinary...')
        const results = await uploadToCloudinary(avatar, "mc-schematic-manager-images")
        
        console.log('> Logging cloudinary results')
        console.log(results)
        imageData = results
        console.log(imageData)
        console.log('> Finished logging imageData')
      } else {
        res.status(404).json({ message: 'Error: Collection image not found!' });
      }

      const newCollection = new Collection({
        name: collectionName,
        tags: tagArr,
        schematics: [],
        image: imageData
      });
      const collection = await newCollection.save();
      console.log('> Added new collection')

      // Add the new collection _id to user.collections
      user.collections.push(collection._id);

      // Save the user object to persist changes
      await user.save();
      console.log('> Updated the user')

      res.status(201).json({ message: 'New collection created successfully!', collection });
    } catch (error) {
      // console.log(error);
      res.status(500).send('Error while creating a new collection: ' + error.message);
    }
  }
);

module.exports = router;
