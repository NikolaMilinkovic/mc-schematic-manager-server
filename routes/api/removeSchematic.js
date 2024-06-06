const express = require('express');
const Schematic = require('../../models/schematic')
const { removeFromCloudinary } = require('../../services/cloudinary');
const router = express.Router();
const path = require('path');
const { check, validationResult } = require('express-validator');

router.get('/:id',
  [
    check('id').notEmpty().withMessage('ID parameter must not be empty!').escape()
  ],
  async(req, res) => {
    // Validation of input
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() })
    }

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
  }
)

module.exports = router;