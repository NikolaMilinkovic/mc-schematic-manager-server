const express = require('express');
const User = require('../../models/user')
const StudioUser = require('../../models/studioUser')
const router = express.Router();

router.get('/',
  async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    const user = await User.findOne({ session_id: sessionId });
    const studioUser = await StudioUser.findOne({ session_id: sessionId });
    
    if (!user && !studioUser) {
      return res.status(401).json({message: 'User not found'});
    }

    if(user){
      res.json(user);
    } else {
      res.json(studioUser);
    }

  } catch(err){
    console.log(err);
    res.status(500).json({message:'Error while fetching user data'});
  }
})

module.exports = router;