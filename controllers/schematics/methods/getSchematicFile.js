const { Schematic, resolveStudioContext } = require('./shared');

async function getSchematicFile(req, res) {
  try {
    const { studio } = await resolveStudioContext(req);
    if (!studio) {
      return res.status(404).send('Schematic not found');
    }

    const schematic = await Schematic.findOne({ _id: req.params.id, studio_id: studio._id });
    if (!schematic) {
      return res.status(404).send('Schematic not found');
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${schematic.original_file_name}"`,
    });

    return res.send(schematic.file);
  } catch (err) {
    return res.status(500).send('Error while fetching schematics');
  }
}

module.exports = getSchematicFile;
