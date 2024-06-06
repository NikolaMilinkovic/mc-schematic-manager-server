const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const router = express.Router();
const Tags = require('../../models/tags');
const Schematic = require('../../models/schematic');
require('dotenv').config();
const { uploadToCloudinary } = require('../../services/cloudinary');
const { getFAWEString } = require('../../FAWE_string');
const { body, validationResult } = require('express-validator');
const User = require('../../models/user');

const upload = multer();
router.post('/', 
  upload.single('schematicFile'),
  [
    body('tags').notEmpty().withMessage('Tags are required!'),
    body('schematicName').notEmpty().withMessage('Schematic name is required!').escape()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Input validation failed.')
      console.log(errors.array())
      return res.status(400).json({ errors: errors.array() });
    }


    const { originalname, buffer } = req.file;
    const { tags, schematicName, image } = req.body;
    const sessionId = req.headers['authorization'];
    // if(sessionId){
    //   console.log('TOKEN WHEN UPLOADING SCHEMATIC IS')
    //   console.log(sessionId);
    // } else {
    //   console.log('SESSION ID NOT FOUND!')
    // }

    try{
      // Check for existing schematic in DB
      const userSchematics = await User.findOne({ session_id: sessionId })
      .populate('schematics')

      for( const schematic of userSchematics.schematics){
        console.log('Comparing schematics')
        if(schematic.file.equals(buffer)){
          return res.status(400).send('Schematic already exists in the database.');
        }
      }

      // Add tags into Tags Arr
      const tagArr = tags.split(',').map(tag => tag.trim());
      const tagsDocument = await Tags.findOne();
      if(!tagsDocument){
        await Tags.create({ tags: tagArr });
      } else {
        const newTags = tagArr.filter(tag => !tagsDocument.tags.includes(tag));
        if(newTags.length > 0){
          await Tags.findOneAndUpdate({}, {$push: { tags: { $each: newTags }}});
        }
      }

      // GET FAWE STRING
      const FAWE = await getFAWEString(originalname, buffer, req, res);
      if(!FAWE){
        throw new Error('Puppeteer failed to extract FAWE strings.')
      }

      let imageData = {}
      if(image){
          const results = await uploadToCloudinary(image, "mc-schematic-manager-images")
          imageData = results
          console.log('Finish with Cloudinary successfully')
      }

      const newSchematic = new Schematic({
        name: schematicName,
        tags: tagArr,
        original_file_name: originalname,
        file: buffer,
        fawe_string: `//schematic load ${FAWE.type} url:${FAWE.upload}`,
        image: imageData
      });

      await newSchematic.save();
      console.log('Schematic added to DB')

      // Find user and link schematic
      const user = await User.findOneAndUpdate(
        { session_id: sessionId },
        { $push: { schematics: newSchematic._id } },
        { new: true }
      )
      // console.log('User updated with new schematic:', user);

      res.status(201).send('File uploaded and stored successfully');

    } catch (error) {
      // console.log(error);
      res.status(500).send('Error uploading file: ' + error.message);
    }
  }
);

module.exports = router;
