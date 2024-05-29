const express = require('express');
const multer = require('multer');
const path = require('path');
const puppeteer = require('puppeteer');
const router = express.Router();

// Configure multer to save files with original names and extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('schematicFile'), async (req, res) => {
  try {
    console.log('File upload started');
    const file = req.file;
    if (!file) {
      console.error('No file uploaded');
      return res.status(400).send('No file uploaded.');
    }

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
    await inputUploadHandle.uploadFile(file.path);

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

    if (redirectUrl) {
      console.log('Redirect URL:', redirectUrl);
      return res.send(redirectUrl);
    } else {
      console.error('Failed to retrieve redirect URL');
      res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
    }
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).send('Error uploading file: ' + error.message);
  }
});

module.exports = router;
