const { normalizeTags } = require('../../../utils/tags');
const { Schematic, resolveStudioContext } = require('./shared');

async function getAllTags(req, res) {
  try {
    const { studio } = await resolveStudioContext(req);
    if (!studio) {
      return res.status(200).json([{ tags: [] }]);
    }

    const distinctTags = await Schematic.distinct('tags', { studio_id: studio._id });
    const tags = normalizeTags(distinctTags).sort((a, b) => a.localeCompare(b));
    return res.status(200).json([{ tags }]);
  } catch (err) {
    return res.status(500).send('Error while fetching schematics');
  }
}

module.exports = getAllTags;
