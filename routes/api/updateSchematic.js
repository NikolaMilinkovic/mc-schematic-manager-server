const express = require('express');
const Schematic = require('../../models/schematic')
const { uploadToCloudinary, removeFromCloudinary } = require('../../services/cloudinary');
const router = express.Router();
const { ObjectId } = require('mongodb');
const multer = require('multer');
const upload = multer();
const { getFAWEString } = require('../../FAWE_string');

router.post('/:id', upload.single('schematicFile'), async(req, res) => {

  try{
  // =========================[EXTRACT DATA]=========================
    // Fetch schematic file
    const id = req.params.id;
    const schematic = await Schematic.findById(id);
    if (!schematic) {
      return res.status(404).json({ message: 'Schematic not found' });
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
    const { tags, schematicName } = req.body;
  // =========================[\EXTRACT DATA]=========================

    // Update Tags and Name
    schematic.tags = tags.split(',');
    schematic.name = schematicName;

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
    res.status(200).json({ message: 'Schematic updated successfully' });
  } catch(err){
    console.log(err)
    res.status(500).json({ message: 'Error while updating schematics' });
  }
})

module.exports = router;