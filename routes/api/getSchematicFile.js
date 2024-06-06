const express = require('express');
const Schematic = require('../../models/schematic')
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
      const schematic = await Schematic.findById(id);
      if (!schematic) {
        return res.status(404).send('Schematic not found');
      }

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${schematic.original_file_name}"`
      });

      res.send(schematic.file);

    } catch(err){
      console.log(err);
      res.status(500).send('Error while fetching schematics');
    }
})

module.exports = router;