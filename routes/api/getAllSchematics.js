const express = require('express');
const Schematic = require('../../models/schematic')
const router = express.Router();
const User = require('../../models/user');

router.get('/', async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    // Find user and link schematic
    const userSchematics = await User.findOne({ session_id: sessionId })
      .populate('schematics')
      .exec()

    res.status(200).json(userSchematics.schematics);
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematics');
  }
})

module.exports = router;