const express = require('express');
const Schematic = require('../../models/schematic');
const puppeteer = require('puppeteer');
const router = express.Router();
const path = require('path');
const fs = require('fs');


router.get('/:id', async(req, res) => {
  try{
    const id = req.params.id
    const schematic = await Schematic.findById(id);
    if (!schematic) {
      return res.status(404).send('Schematic not found');
    }
    console.log(schematic)

    // Check for last update
    const currentDate = Date.now()
    const lastUpdated = new Date(schematic.last_updated);
    const daysDifference = (currentDate - lastUpdated) / (1000 * 60 * 60 * 24);


    // ===============[UPDATE THE STRING IF OUTDATED]===============
    if(daysDifference > 30) {
      // Store files temporarily
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }
      const tempFilePath = path.join(uploadsDir, schematic.original_file_name);
      fs.writeFileSync(tempFilePath, schematic.file); // Moze biti greska

      console.log('Launching Puppeteer');
      const launchOptions = { headless: true };
      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      console.log('Navigating to the upload page');
      await page.goto('https://schem.intellectualsites.com/fawe/index.php');

      console.log('Waiting for file input selector');
      await page.waitForSelector('input[type=file]');
      const inputUploadHandle = await page.$('input[type=file]');

      console.log('Uploading file');
      await inputUploadHandle.uploadFile(tempFilePath);

      let redirectUrl;
      // Listen for response events to track redirects
      page.on('response', async (response) => {
        const headers = response.headers();
        if (headers.location) {
          redirectUrl = headers.location;
        }
      });

      // Use a try-catch block to catch TimeoutError and ignore it
      try {
        console.log('Waiting for navigation');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 1000 });
      } catch {
        console.warn('Navigation timed out, continuing...');
      }

      await browser.close();
      fs.unlinkSync(tempFilePath);

      // PARSE THE STRING
      const parseUrl = new URL(
        `http://localhost:3000/${displayUrl.toString()}`,
      );
      const upload = parseUrl.searchParams.get('upload');
      const type = parseUrl.searchParams.get('type');

      if (redirectUrl) {
        console.log('Adding missing fields')
        if (!schematic.hasOwnProperty('fawe_string')) {
          schematic.fawe_string = `//schematic load ${type} url:${upload}`;
        }
        if (!schematic.hasOwnProperty('last_updated')) {
          schematic.last_updated = new Date();
        }

        console.log('Updating fields')
        schematic.fawe_string = `//schematic load ${type} url:${upload}`;
        schematic.last_updated = new Date();

        console.log(schematic)
        await schematic.save();

        return res.send(schematic.fawe_string);
      } else {
        console.error('Failed to retrieve redirect URL');
        res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
      }
    } 
    // SAMO SALJEMO STRING
    else {
      console.log(`Returning to user: ${schematic.fawe_string}`)
      return res.send(schematic.fawe_string);
    }
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).send('Error uploading file: ' + error.message);
  }
})

module.exports = router;