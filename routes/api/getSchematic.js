const express = require('express');
const Schematic = require('../../models/schematic')
const router = express.Router();
const { check, validationResult } = require('express-validator');

router.get('/:id',
  [
    check('id').notEmpty().withMessage('Parameter for schematic not found').escape()
  ],
  async(req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  try{
    const id = req.params.id
    const schematic = await Schematic.findById(id);
    if (!schematic) {
      return res.status(404).json({message: 'Schematic not found'});
    }

    res.json(schematic);

  } catch(err){
    console.log(err);
    res.status(500).json({message:'Error while fetching schematics'});
  }
})

module.exports = router;