const express = require('express');
const Schematic = require('../../models/schematic')
const router = express.Router();
const path = require('path');

router.get('/:id', async(req, res) => {
  try{
    const id = req.params.id
    const schematic = await Schematic.findById(id);
    if (!schematic) {
      return res.status(404).send('Schematic not found');
    }

    res.send(schematic);

  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematics');
  }
})

module.exports = router;