const express = require('express');
const { uploadToCloudinary, removeFromCloudinary } = require('../../../services/cloudinary');
const router = express.Router();
const { ObjectId } = require('mongodb');
const multer = require('multer');
const upload = multer();
const { body, check, validationResult } = require('express-validator');
const Collection = require('../../../models/collection');
const User = require('../../../models/user');


router.post('/:id',
  upload.single('avatar'),
  [
    body('name').notEmpty().withMessage('Name is required').escape(),
    body('tags').notEmpty().withMessage('Tags are required').escape(),
  ],
  async(req, res) => {
    // Validation of input
    const errors = validationResult(req)
    if (!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() })
    }

    try{
    // =========================[EXTRACT DATA]=========================
      const id = req.params.id
      const { avatar, name, blurHash, blurHashWidth, blurHashHeight } = req.body;
      const tags = req.body.tags.split(',').map(tag => tag.trim());
      console.log(blurHash)
      console.log(blurHashWidth)
      console.log(blurHashHeight)
    // =========================[\EXTRACT DATA]=========================

    console.log('> Fetching collection by ID')
    const collection = await Collection.findById(id);
    console.log('> Collection found')
      
      // HANDLE AVATAR UPDATE
      if (avatar) {
        console.log('> Handling Avatar')
        let imageData = {}
        await removeFromCloudinary(collection.image.publicId);
        const results = await uploadToCloudinary(avatar, "mc-schematic-manager-images")
        imageData = results
        collection.image = imageData;
        console.log(`> Updated collection image to url: ${imageData.url}`);
      }

      console.log('> Setting collection name & tags')
      collection.name = name;
      collection.tags = tags;
      if (blurHash) {
        collection.blur_hash = {
          hash: blurHash,
          width: blurHashWidth,
          height: blurHashHeight
        };
      }

      // User CollectionTags update
      console.log('> Updating user')
      let user;
      if(req.user.role === 'studio_user'){
        console.log('> User found, updating tags');
        user = await User.findById(req.user.parent_user_id);
      }
      if(req.user.role === 'owner'){
        console.log('> User found, updating tags');
        user = await User.findById(req.user._id);
      }
      if(!user){
        console.log('Error: No user found.');
        return res.status(404).json({ message: 'User id not found.', status: 404 });
      }
        // const newTags = tags.filter(tag => !user.collection_tags.includes(tag));
        // if(newTags.length > 0){
        //   console.log('> Adding new tags')
        //   newTags.forEach(tag => {
        //     console.log('> Pushing tag..', tag);
        //     user.collection_tags.push(tag);
        //   });
        // }
      user.collection_tags = tags;

      console.log('> Saving user & collection')
      user.save();
      collection.save();
      res.status(200).json({ message: 'Collection updated successfuly!', status: 200 });
    } catch(err){
      console.log(err)
      res.status(500).json({ message: 'Error while updating the profile', status: 500 });
    }
  }
)

module.exports = router;