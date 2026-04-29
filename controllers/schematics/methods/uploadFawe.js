const { getFAWEString } = require('../../../FAWE_string');

async function uploadFawe(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const fawe = await getFAWEString(req.file.originalname, req.file.buffer, req, res);
    if (!fawe?.upload) {
      return res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
    }

    return res.send(fawe.upload);
  } catch (error) {
    return res.status(500).send(`Error uploading file: ${error.message}`);
  }
}

module.exports = uploadFawe;
