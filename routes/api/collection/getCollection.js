const express = require('express');
const User = require('../../../models/user')
const StudioUser = require('../../../models/studioUser');
const Collection = require('../../../models/collection');
const Schematic = require('../../../models/schematic')
const router = express.Router();

router.get('/:id',
  async(req, res) => {
  try{
    const { id } = req.params;
    console.log('LOGGING THE ID')
    console.log(id);
    const collection = await Collection.findOne({ _id: id })
      .select('-file -created_at -last_updated')
      .populate('schematics', '-file -created_at -last_updated')

    if (!collection) {
      return res.status(404).json({ message: `Collection with ID: ${id} not found.` });
    }

    res.status(200).json({ collection });


  } catch(err){
    console.log(err);
    res.status(500).json({message:'Error while fetching user data'});
  }
})

module.exports = router;