const express = require('express');
const Schematic = require('../../models/schematic')
const { uploadToCloudinary, removeFromCloudinary } = require('../../services/cloudinary');
const router = express.Router();
const { ObjectId } = require('mongodb');
const multer = require('multer');
const upload = multer();
const { getFAWEString } = require('../../FAWE_string');
const { body, check, validationResult } = require('express-validator');
const Collection = require('../../models/collection')

router.post('/:id',
  upload.single('schematicFile'),
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape(),
    body('tags').notEmpty().withMessage('Tags are required'),
    body('schematicName').notEmpty().withMessage('Schematic name is required').escape(),
    body('blurHash').optional().escape(),
    body('blurHashWidth').optional().escape(),
    body('blurHashHeight').optional().escape(),
  ],
  async(req, res) => {
    // Validation of input
    const errors = validationResult(req)
    if (!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() })
    }

    try{
    // =========================[EXTRACT DATA]=========================
      // Fetch schematic file
      const id = req.params.id;
      const schematic = await Schematic.findById(id);
      if (!schematic) {
        return res.status(404).json({ message: 'Schematic not found', status: 404 });
      }
      // Check for new File
      let originalname;
      let buffer;
      if(req.file) { 
        originalname = req.file.originalname;
        buffer  = req.file.buffer;
      }
      // Check for new Image
      let image;
      if(req.body.image){
        image = req.body.image;
      }
      // Get Schematic Name and Tags
      const { 
        tags,
        schematicName, 
        blurHash, 
        blurHashWidth, 
        blurHashHeight, 
        updatedCollections, 
        removedCollections 
      } = req.body;

      console.log('Updated Collections are:')
      console.log(updatedCollections)

      console.log('Removed Collections are:')
      console.log(removedCollections)
    // =========================[\EXTRACT DATA]=========================

    // Handle removing schematic from collections
      async function processRemovedCollections(removedCollections) {
        try {
          for (const collection of removedCollections) {
            const foundCollection = await Collection.findById(collection.collection_id);
            if (!foundCollection) {
              console.log(`Collection with ID ${collection.collection_id} not found.`);
              continue;
            }
      
            // Update collection.schematics by filtering out the schematic ID ('id')
            foundCollection.schematics = foundCollection.schematics.filter(schematic => String(schematic._id) !== id);
            await foundCollection.save();
          }
        } catch (err) {
          console.error('Error removing schematic from collection.', err);
        }
      }
      if (removedCollections) {
        await processRemovedCollections(JSON.parse(removedCollections));
      }

      // Handle adding schematic to collections
      async function processAddToCollections(updatedCollections) {
        try {
          for (const collection of updatedCollections) {
            const foundCollection = await Collection.findByIdAndUpdate(
              collection.collection_id,
              {$push: {schematics: id}},
              {new: true}
            );

            if (!foundCollection) {
              console.log(`Collection with ID ${collection.collection_id} not found.`);
            }
          }
        } catch (err) {
          console.error('Error adding schematic to collection', err);
        }
      }
      if(updatedCollections){
        await processAddToCollections(JSON.parse(updatedCollections))
      }

      // Update Tags and Name
      schematic.tags = tags.split(',');
      schematic.name = schematicName;
      if (blurHash) {
        schematic.blur_hash = {
          hash: blurHash,
          width: blurHashWidth,
          height: blurHashHeight
        };
      }

      if(req.file){
        const FAWE = await getFAWEString(originalname, buffer, req, res);
    
        schematic.original_file_name = originalname;
        schematic.file = buffer;
        schematic.fawe_string = `//schematic load ${FAWE.type} url:${FAWE.upload}`;
      }

      if (image) {
        let imageData = {}
        await removeFromCloudinary(schematic.image.publicId);
        const results = await uploadToCloudinary(image, "mc-schematic-manager-images")
        imageData = results
        schematic.image = imageData;
      }

      await schematic.save();
      res.status(200).json({ message: 'Schematic updated successfully', status: 200 });
    } catch(err){
      console.log(err)
      res.status(500).json({ message: 'Error while updating schematics', status: 500 });
    }
  }
)

module.exports = router;