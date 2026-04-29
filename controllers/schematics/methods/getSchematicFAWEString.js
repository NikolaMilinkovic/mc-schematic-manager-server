const { getFAWEString } = require('../../../FAWE_string');
const { Schematic, resolveStudioContext } = require('./shared');

async function getSchematicFAWEString(req, res) {
  try {
    const { studio } = await resolveStudioContext(req);
    if (!studio) {
      return res.status(404).send('Schematic not found');
    }

    const schematic = await Schematic.findOne({ _id: req.params.id, studio_id: studio._id });
    if (!schematic) {
      return res.status(404).send('Schematic not found');
    }

    const currentDate = Date.now();
    const lastUpdated = new Date(schematic.last_updated);
    const daysDifference = (currentDate - lastUpdated) / (1000 * 60 * 60 * 24);

    if (daysDifference > 30) {
      const fawe = await getFAWEString(
        schematic.original_file_name,
        schematic.file,
        req,
        res,
      );

      if (!fawe) {
        return res.status(500).json({ error: 'Failed to retrieve redirect URL.' });
      }

      schematic.fawe_string = `//schematic load ${fawe.type} url:${fawe.upload}`;
      schematic.last_updated = new Date();
      await schematic.save();
    }

    return res.send(schematic.fawe_string);
  } catch (error) {
    return res.status(500).send(`Error uploading file: ${error.message}`);
  }
}

module.exports = getSchematicFAWEString;
