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