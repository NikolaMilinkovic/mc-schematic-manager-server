const express = require('express');
const Tags = require('../../models/tags')
const router = express.Router();

router.get('/', async(req, res) => {
  try{
    const tagsList = await Tags.find();

    res.status(200).json(tagsList);
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematics');
  }
})

module.exports = router;