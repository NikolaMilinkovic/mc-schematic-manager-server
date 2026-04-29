const { generatePresignedGetUrl } = require('../../../utils/S3');
const { Schematic, resolveStudioContext } = require('./shared');

// 1 hour — long enough for a working session, short enough to limit exposure
const PRESIGNED_URL_TTL_SECONDS = 3600;

async function getSchematicImageUrl(req, res) {
  try {
    const { studio } = await resolveStudioContext(req);
    if (!studio) {
      return res.status(404).json({ message: 'Schematic not found' });
    }

    const schematic = await Schematic.findOne(
      { _id: req.params.id, studio_id: studio._id },
      { image: 1 },
    );

    if (!schematic) {
      return res.status(404).json({ message: 'Schematic not found' });
    }

    if (!schematic.image?.key) {
      return res.status(404).json({ message: 'Schematic has no image.' });
    }

    const signedUrl = await generatePresignedGetUrl(
      schematic.image.key,
      PRESIGNED_URL_TTL_SECONDS,
    );

    return res.status(200).json({
      url: signedUrl,
      expires_in: PRESIGNED_URL_TTL_SECONDS,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error generating image URL.' });
  }
}

module.exports = getSchematicImageUrl;
