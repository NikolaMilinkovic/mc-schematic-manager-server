const { getFAWEString } = require('../../../FAWE_string');
const { normalizeTags } = require('../../../utils/tags');
const { uploadBase64ImageToS3, deleteFromS3 } = require('../../../utils/S3');
const {
  Schematic,
  Collection,
  parseJsonArray,
  resolveStudioContext,
} = require('./shared');

async function updateSchematic(req, res) {
  try {
    const { studio } = await resolveStudioContext(req);
    if (!studio) {
      return res.status(404).json({ message: 'Studio context not found for current user.' });
    }

    const id = req.params.id;
    const schematic = await Schematic.findOne({ _id: id, studio_id: studio._id });
    if (!schematic) {
      return res.status(404).json({ message: 'Schematic not found', status: 404 });
    }

    const {
      tags,
      schematicName,
      blurHash,
      blurHashWidth,
      blurHashHeight,
      updatedCollections,
      removedCollections,
    } = req.body;

    const parsedRemovedCollections = parseJsonArray(removedCollections);
    if (parsedRemovedCollections.length > 0) {
      for (const collection of parsedRemovedCollections) {
        if (!collection.collection_id) {
          continue;
        }

        await Collection.findByIdAndUpdate(collection.collection_id, {
          $pull: { schematics: id },
        });
      }
    }

    const parsedUpdatedCollections = parseJsonArray(updatedCollections);
    if (parsedUpdatedCollections.length > 0) {
      for (const collection of parsedUpdatedCollections) {
        if (!collection.collection_id) {
          continue;
        }

        await Collection.findByIdAndUpdate(collection.collection_id, {
          $addToSet: { schematics: id },
        });
      }
    }

    schematic.tags = normalizeTags(tags);
    schematic.name = schematicName;

    if (blurHash) {
      schematic.blur_hash = {
        hash: blurHash,
        width: blurHashWidth,
        height: blurHashHeight,
      };
    }

    if (req.file) {
      const fawe = await getFAWEString(req.file.originalname, req.file.buffer, req, res);

      schematic.original_file_name = req.file.originalname;
      schematic.file = req.file.buffer;
      schematic.fawe_string = `//schematic load ${fawe.type} url:${fawe.upload}`;
    }

    if (req.body.image) {
      if (schematic.image?.key) {
        await deleteFromS3(schematic.image.key);
      }

      const imageData = await uploadBase64ImageToS3(req.body.image, {
        keyPrefix: `clients/${studio._id}/schematics/images/`,
      });

      schematic.image = {
        key: imageData.key,
        url: imageData.url,
      };
    }

    await schematic.save();
    return res.status(200).json({ message: 'Schematic updated successfully', status: 200 });
  } catch (err) {
    return res.status(500).json({ message: 'Error while updating schematics', status: 500 });
  }
}

module.exports = updateSchematic;
