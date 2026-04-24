const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
require("dotenv").config();

const uploadsDir = path.join(__dirname, "./uploads");
const FAWE_UPLOAD_URL = "https://schem.intellectualsites.com/fawe/index.php";

let browserInstance;
let browserLaunchPromise;

const launchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

async function getBrowser() {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  if (!browserLaunchPromise) {
    browserLaunchPromise = puppeteer
      .launch(launchOptions)
      .then((browser) => {
        browserInstance = browser;
        browser.on("disconnected", () => {
          browserInstance = undefined;
          browserLaunchPromise = undefined;
        });
        return browser;
      })
      .catch((error) => {
        browserLaunchPromise = undefined;
        throw error;
      });
  }

  return browserLaunchPromise;
}

async function createTempUploadFile(originalname, buffer) {
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const safeName = path.basename(originalname || "upload.schem");
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
  const tempFilePath = path.join(uploadsDir, uniqueName);
  await fs.promises.writeFile(tempFilePath, buffer);
  return tempFilePath;
}

function parseRedirectUrl(redirectUrl) {
  const parseUrl = new URL(redirectUrl, "https://schem.intellectualsites.com");
  const upload = parseUrl.searchParams.get("upload");
  const type = parseUrl.searchParams.get("type");

  if (!upload || !type) {
    return null;
  }

  return { upload, type };
}

const getFAWEString = async (originalname, buffer, req, res) => {
  let tempFilePath;
  let page;

  try {
    console.log("Starting getFAWEString...");
    tempFilePath = await createTempUploadFile(originalname, buffer);

    const browser = await getBrowser();
    page = await browser.newPage();
    console.log("New page created");

    // Block non-essential assets to reduce page load overhead.
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (
        resourceType === "image" ||
        resourceType === "font" ||
        resourceType === "stylesheet"
      ) {
        request.abort();
        return;
      }
      request.continue();
    });

    await page.goto(FAWE_UPLOAD_URL, { waitUntil: "domcontentloaded" });
    console.log("Navigated to upload page");
    await page.waitForSelector("input[type=file]", { timeout: 15000 });
    console.log("File input selector found");
    const inputUploadHandle = await page.$("input[type=file]");
    if (!inputUploadHandle) {
      throw new Error("Failed to find file input on FAWE page.");
    }

    const redirectResponsePromise = page.waitForResponse(
      (response) => {
        const headers = response.headers();
        const location = headers.location || headers.Location;
        return Boolean(location);
      },
      { timeout: 25000 },
    );

    await inputUploadHandle.uploadFile(tempFilePath);
    console.log("File uploaded");

    const redirectResponse = await redirectResponsePromise;
    const redirectHeaders = redirectResponse.headers();
    const redirectUrl = redirectHeaders.location || redirectHeaders.Location;
    const result = redirectUrl
      ? parseRedirectUrl(redirectUrl.toString())
      : null;

    if (!result) {
      throw new Error("Failed to parse redirect URL from FAWE response.");
    }

    console.log("Puppeteer finished successfully");
    console.log("Returning: " + JSON.stringify(result));
    return result;
  } catch (err) {
    console.log("Error:", err);
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }

    if (tempFilePath) {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
  }
};

module.exports = { getFAWEString };
