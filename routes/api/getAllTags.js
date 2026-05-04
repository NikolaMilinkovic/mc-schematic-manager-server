const express = require('express');
const Schematic = require('../../models/schematic')
const { normalizeTags } = require('../../utils/tags');
const router = express.Router();

router.get('/', async(req, res) => {
  try{
    const distinctTags = await Schematic.distinct('tags');
    const tags = normalizeTags(distinctTags).sort((a, b) => a.localeCompare(b));
    res.status(200).json([{ tags }]);
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematics');
  }
})

module.exports = router;