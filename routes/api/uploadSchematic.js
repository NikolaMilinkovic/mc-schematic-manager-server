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

const upload = multer();
router.post('/', upload.single('schematicFile'), async (req, res) => {
  const { originalname, buffer } = req.file;
  const { tags, schematicName, image } = req.body;

  try{
    // Check for existing schematic in DB
    const existingSchematic = await Schematic.findOne({ file: buffer });
    if(existingSchematic){
      return res.status(400).send('Schematic already exists in the database.')
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
    res.status(201).send('File uploaded and stored successfully');

  } catch (error) {
    console.log(error);
    res.status(500).send('Error uploading file: ' + error.message);
  }
});

module.exports = router;
