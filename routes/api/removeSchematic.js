const express = require('express');
const Schematic = require('../../models/schematic')
const router = express.Router();
const path = require('path');

router.get('/:id', async(req, res) => {
  try{
    const id = req.params.id
    const schematic = await Schematic.findOneAndDelete({ _id: id });
    if (!schematic) {
      return res.status(404).send('Schematic not found');
    }

    res.status(201).send('Schematic removed successfully');
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematic');
  }
})

module.exports = router;