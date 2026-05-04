const { Schematic, resolveStudioContext } = require('./shared');
const { generatePresignedGetUrl } = require('../../../utils/S3');

async function getSchematic(req, res) {
  try {
    const { studio } = await resolveStudioContext(req);
    if (!studio) {
      return res.status(404).json({ message: 'Schematic not found' });
    }

    const schematic = await Schematic.findOne({ _id: req.params.id, studio_id: studio._id }).lean();
    if (!schematic) {
      return res.status(404).json({ message: 'Schematic not found' });
    }

    if (schematic.image?.key) {
      schematic.image.url = await generatePresignedGetUrl(schematic.image.key);
    }

    return res.json(schematic);
  } catch (err) {
    return res.status(500).json({ message: 'Error while fetching schematics' });
  }
}

module.exports = getSchematic;
