const { deleteFromS3 } = require('../../../utils/S3');
const {
  Schematic,
  User,
  Collection,
  resolveStudioContext,
} = require('./shared');

async function removeSchematic(req, res) {
  try {
    const { ownerUser, studio } = await resolveStudioContext(req);
    if (!ownerUser || !studio) {
      return res.status(404).json({ message: 'Studio context not found for current user.' });
    }

    const id = req.params.id;
    const schematic = await Schematic.findOneAndDelete({ _id: id, studio_id: studio._id });
    if (!schematic) {
      return res.status(404).send('Schematic not found');
    }

    await User.findByIdAndUpdate(ownerUser._id, {
      $pull: { schematics: id },
    });

    await Collection.updateMany(
      { schematics: id },
      { $pull: { schematics: id } },
    );

    if (schematic.image?.key) {
      await deleteFromS3(schematic.image.key);
    }

    return res.status(201).send('Schematic removed successfully');
  } catch (err) {
    return res.status(500).send('Error while removing schematic');
  }
}

module.exports = removeSchematic;
