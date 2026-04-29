const { getFAWEString } = require('../../../FAWE_string');
const { normalizeTags } = require('../../../utils/tags');
const { uploadBase64ImageToS3 } = require('../../../utils/S3');
const {
  Schematic,
  User,
  Collection,
  parseJsonArray,
  resolveStudioContext,
} = require('./shared');

async function uploadSchematic(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing schematic file.' });
    }

    const { ownerUser, studio } = await resolveStudioContext(req);
    if (!ownerUser || !studio) {
      return res.status(404).json({ message: 'Studio context not found for current user.' });
    }

    const { originalname, buffer } = req.file;
    const {
      tags,
      schematicName,
      image,
      blurHash,
      blurHashWidth,
      blurHashHeight,
      collectionsList,
    } = req.body;

    const existingSchematics = await Schematic.find({ studio_id: studio._id }).select('file');
    for (const existing of existingSchematics) {
      if (existing.file?.equals(buffer)) {
        return res.status(400).send('Schematic already exists in the database.');
      }
    }

    if (!image) {
      return res.status(400).json({ message: 'Schematic image is required.' });
    }

    const fawe = await getFAWEString(originalname, buffer, req, res);
    if (!fawe) {
      throw new Error('Failed to extract FAWE string');
    }

    const imageData = await uploadBase64ImageToS3(image, {
      keyPrefix: `clients/${studio._id}/schematics/images/`,
    });

    const newSchematic = new Schematic({
      name: schematicName,
      studio_id: studio._id,
      tags: normalizeTags(tags),
      original_file_name: originalname,
      file: buffer,
      fawe_string: `//schematic load ${fawe.type} url:${fawe.upload}`,
      image: {
        key: imageData.key,
        url: imageData.url,
      },
      blur_hash: {
        hash: blurHash,
        width: blurHashWidth,
        height: blurHashHeight,
      },
    });

    await newSchematic.save();

    await User.findByIdAndUpdate(ownerUser._id, {
      $addToSet: { schematics: newSchematic._id },
    });

    const parsedCollections = parseJsonArray(collectionsList);
    if (parsedCollections.length > 0) {
      for (const collection of parsedCollections) {
        if (!collection.collection_id) {
          continue;
        }

        await Collection.findByIdAndUpdate(collection.collection_id, {
          $addToSet: { schematics: newSchematic._id },
        });
      }
    }

    return res.status(201).send('File uploaded and stored successfully');
  } catch (error) {
    return res.status(500).json({
      message: `There was an error uploading the schematic ${error.message}`,
    });
  }
}

module.exports = uploadSchematic;
