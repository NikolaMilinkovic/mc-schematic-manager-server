const express = require('express');
const Schematic = require('../../models/schematic')
const { removeFromCloudinary } = require('../../services/cloudinary');
const router = express.Router();
const path = require('path');

router.get('/:id', async(req, res) => {
  try{
    const id = req.params.id
    const cachedSchematic = await Schematic.findOne({ _id:id });
    if (!cachedSchematic) {
      return res.status(404).send('Schematic not found');
    }
    const schematic = await Schematic.findOneAndDelete({ _id: id });
    if (!schematic) {
      return res.status(404).send('Schematic not found');
    }

    // Removes the img from Cloudinary
    await removeFromCloudinary(cachedSchematic.image.publicId);

    res.status(201).send('Schematic removed successfully');
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematic');
  }
})

module.exports = router;