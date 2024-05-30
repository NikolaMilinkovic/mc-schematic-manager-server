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

    // ======================[\FAWE STRING]======================
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    const tempFilePath = path.join(uploadsDir, originalname);
    fs.writeFileSync(tempFilePath, buffer);

    // Launching Puppeteer
    const launchOptions = { headless: true };
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // Navigating to the upload page
    await page.goto('https://schem.intellectualsites.com/fawe/index.php');

    // Waiting for file input selector
    await page.waitForSelector('input[type=file]');
    const inputUploadHandle = await page.$('input[type=file]');

    // Uploading file
    await inputUploadHandle.uploadFile(tempFilePath);

    var redirectUrl;
    // Listen for response events to track redirects
    page.on('response', async (response) => {
      const headers = response.headers();
      if (headers.location) {
        redirectUrl = headers.location;
      }
    });

    // Use a try-catch block to catch TimeoutError and ignore it
    try {
      // Waiting for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 1000 });
    } catch {
      console.warn('Navigation timed out, continuing...');
    }

    await browser.close();
    fs.unlinkSync(tempFilePath);

    if (redirectUrl) {
      // PARSE THE STRING
      const parseUrl = new URL(
        `http://localhost:3000/${redirectUrl.toString()}`,
      );
      var upload = parseUrl.searchParams.get('upload');
      var type = parseUrl.searchParams.get('type');
      console.log('Finish with puppeteer successfully')

    } else {
      console.error('Failed to retrieve redirect URL');
      res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
    }

    // ======================[\FAWE STRING]======================

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
      fawe_string: `//schematic load ${type} url:${upload}`,
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
