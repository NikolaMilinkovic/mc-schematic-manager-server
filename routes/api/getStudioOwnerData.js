const express = require('express');
const User = require('../../models/user');
const router = express.Router();

router.get('/',
  async(req, res) => {
  try{
    let user;

    console.log(req.user)
    if(req.user.role === 'studio_user'){
      user = await User.findOne({ _id: req.user.parent_user_id });
      console.log(user)
    }

    if (!user) {
      return res.status(401).json({message: 'Studio name not found'});
    }

    if(user){
      res.json({ ownerData: user });
    }

  } catch(err){
    console.log(err);
    res.status(500).json({message:'Error while fetching user data'});
  }
})

module.exports = router;