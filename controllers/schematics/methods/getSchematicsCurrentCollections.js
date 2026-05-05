const Collection = require('../../../models/collection');

async function getSchematicsCurrentCollections(req, res) {
  try {
    const { id } = req.params;

    const collections = await Collection.find(
      { schematics: id },
      { _id: 1, name: 1 },
    ).lean();

    const currentCollections = collections.map((c) => ({
      collection_id: c._id,
      collection_name: c.name,
    }));

    return res.json({ currentCollections });
  } catch (err) {
    return res.status(500).json({ message: 'Error while fetching collections' });
  }
}

module.exports = getSchematicsCurrentCollections;
