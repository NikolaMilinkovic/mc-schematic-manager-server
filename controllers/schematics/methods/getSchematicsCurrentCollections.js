const { User, resolveStudioContext } = require('./shared');

async function getSchematicsCurrentCollections(req, res) {
  try {
    const { ownerUser } = await resolveStudioContext(req);
    if (!ownerUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const userWithCollections = await User.findById(ownerUser._id).populate({
      path: 'collections',
      select: 'name _id schematics',
    });

    if (!userWithCollections) {
      return res.status(401).json({ message: 'User not found' });
    }

    const schematicId = req.params.id;
    const currentCollections = [];

    for (const collection of userWithCollections.collections) {
      for (const schematic of collection.schematics) {
        if (String(schematic) === schematicId) {
          currentCollections.push({
            collection_name: collection.name,
            collection_id: collection._id,
          });
        }
      }
    }

    return res.json({ currentCollections });
  } catch (err) {
    return res.status(500).json({ message: 'Error while fetching user data' });
  }
}

module.exports = getSchematicsCurrentCollections;
