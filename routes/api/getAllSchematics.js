const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const StudioUser = require('../../models/studioUser');

router.get('/', async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    const userRole = req.user.role;

    let userSchematics;
    // Find user and link schematic
    if(userRole && userRole === 'studio_user'){
      const studioUser = await StudioUser.findOne({ session_id: sessionId })
      userSchematics = await User.findOne({ _id: studioUser.parent_user_id })
        .select('-file')
        .populate('schematics', '-file')
        .exec()
    } else {
      userSchematics = await User.findOne({ session_id: sessionId })
        .select('-file')
        .populate('schematics', '-file')
        .exec()
    }

    return res.status(200).json(userSchematics.schematics);
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching schematics');
  }
})

module.exports = router;