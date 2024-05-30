const express = require('express');
const Schematic = require('../../models/schematic')
const router = express.Router();

router.get('/:id', async(req, res) => {
  try{
    const id = req.params.id
    console.log(id);
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