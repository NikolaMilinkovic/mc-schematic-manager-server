const express = require('express');
const Schematic = require('../../models/schematic')
const router = express.Router();
const path = require('path');

router.get('/', async(req, res) => {
  try{
    const schematics = await Schematic.find();

    res.status(200).json(schematics);
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematics');
  }
})

module.exports = router;