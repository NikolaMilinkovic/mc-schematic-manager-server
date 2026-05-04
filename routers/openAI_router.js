const express = require("express");
const { analyzeImage } = require("../controllers/openai/openAI_Controller");

const router = express.Router();

router.post("/image-to-json", analyzeImage);

module.exports = router;
