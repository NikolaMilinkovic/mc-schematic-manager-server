const {
  Schematic,
  Collection,
  escapeRegex,
  parseCsvParam,
  resolveStudioContext,
} = require('./shared');
const { generatePresignedGetUrl } = require('../../../utils/S3');

async function getAllSchematics(req, res) {
  try {
    const { studio } = await resolveStudioContext(req);
    if (!studio) {
      return res.status(200).json({ schematics: [], totalCount: 0, page: 1, pageSize: 100 });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 100));
    const search = req.query.search?.trim() || '';
    const tags = parseCsvParam(req.query.tags);
    const collections = parseCsvParam(req.query.collections);

    const filter = { studio_id: studio._id };

    if (collections.length > 0) {
      const matchedCollections = await Collection.find({ _id: { $in: collections } })
        .select('schematics')
        .lean();

      const collectionSchematicIds = matchedCollections.flatMap((collection) => collection.schematics || []);
      filter._id = { $in: collectionSchematicIds };
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (tags.length > 0) {
      filter.tags = {
        $in: tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, 'i')),
      };
    }

    const [schematicDocs, totalCount] = await Promise.all([
      Schematic.find(filter)
        .select('-file -fawe_string')
        .sort({ created_at: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      Schematic.countDocuments(filter),
    ]);

    const schematics = await Promise.all(
      schematicDocs.map(async (s) => {
        if (s.image?.key) {
          s.image.url = await generatePresignedGetUrl(s.image.key);
        }
        return s;
      }),
    );

    return res.status(200).json({ schematics, totalCount, page, pageSize });
  } catch (err) {
    return res.status(500).send('Error while fetching schematics');
  }
}

module.exports = getAllSchematics;
