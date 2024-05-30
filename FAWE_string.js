const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
require('dotenv').config();
    
    
    // ======================[\FAWE STRING]======================
  const getFAWEString = async (originalname, buffer, req, res) => {
    try{
      const uploadsDir = path.join(__dirname, './uploads');
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
          `${process.env.HOST}${redirectUrl.toString()}`,
        );
        var upload = parseUrl.searchParams.get('upload');
        var type = parseUrl.searchParams.get('type');
        const result = {
          upload: upload, 
          type: type
        }

        console.log('Puppeteer finishes successfully!');
        console.log('Returning: ' + result);
        return result;

      } else {
        console.error('Failed to retrieve redirect URL');
        res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
      }
    } catch(err){
      console.log(err);
      res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
    }
  }

  module.exports = { getFAWEString }