const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
require('dotenv').config();
const puppeteer = require('puppeteer');

const getFAWEString = async (originalname, buffer, req, res) => {
  try {
    console.log('Starting getFAWEString...');
    const uploadsDir = path.join(__dirname, './uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    const tempFilePath = path.join(uploadsDir, originalname);
    fs.writeFileSync(tempFilePath, buffer);

    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome'
    };

    const browser = await puppeteer.launch(launchOptions);
    console.log('Browser launched');
    const page = await browser.newPage();
    console.log('New page created');

    await page.goto('https://schem.intellectualsites.com/fawe/index.php');
    console.log('Navigated to upload page');
    await page.waitForSelector('input[type=file]');
    console.log('File input selector found');
    const inputUploadHandle = await page.$('input[type=file]');
    await inputUploadHandle.uploadFile(tempFilePath);
    console.log('File uploaded');

    let redirectUrl;
    page.on('response', async (response) => {
      const headers = response.headers();
      if (headers.location) {
        redirectUrl = headers.location;
      }
    });

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
    } catch {
      console.warn('Navigation timed out, continuing...');
    }

    await browser.close();
    fs.unlinkSync(tempFilePath);
    console.log('Browser closed and temp file deleted');

    if (redirectUrl) {
      const parseUrl = new URL(`${process.env.HOST}${redirectUrl.toString()}`);
      const upload = parseUrl.searchParams.get('upload');
      const type = parseUrl.searchParams.get('type');
      const result = { upload, type };

      console.log('Puppeteer finished successfully');
      console.log('Returning: ' + JSON.stringify(result));
      return result;
    } else {
      console.error('Failed to retrieve redirect URL');
      res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
    }
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
  }
};

module.exports = { getFAWEString };
