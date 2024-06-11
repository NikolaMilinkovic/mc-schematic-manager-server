const express = require('express');
const User = require('../../models/user');
const StudioUser = require('../../models/studioUser');
const router = express.Router();

router.get('/', async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    // console.log(sessionId)
    console.log(req.user.role)
    if(req.user.role === 'studio_user'){
      const studio_users = await User.findOne({ _id: req.user.parent_user_id })
        .populate('studio.users')
        .exec()

      res.status(200).json(studio_users);
    } else {
      const studio_users = await User.findOne({ session_id: sessionId })
        .populate('studio.users')
        .exec()

      res.status(200).json(studio_users);
    }
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching studio users');
  }
})

module.exports = router;