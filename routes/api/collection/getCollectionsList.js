const express = require('express');
const User = require('../../../models/user')
const StudioUser = require('../../../models/studioUser');
const Collection = require('../../../models/collection');
const router = express.Router();

router.get('/',
  async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    let user;
    let collections;

    if(req.user.role === 'studio_user'){
      user = await User.findOne({ _id: req.user.parent_user_id })
        .select('collections')
        .populate({
          path: 'collections',
          select: 'name'
        });
      collections = user.collections.map((collection) => ({
        _id: collection._id,
        name: collection.name
      }));
    } else {
      user = await User.findOne({ session_id: sessionId })
        .select('collections')
        .populate({
          path: 'collections',
          select: 'name'
        });
      collections = user.collections.map((collection) => ({
        collection_id: collection._id,
        collection_name: collection.name
      }));
    }

    if (!user) {
      return res.status(401).json({message: 'User not found'});
    }

    if(user && collections){
      res.json({ collections });
    }

  } catch(err){
    console.log(err);
    res.status(500).json({message:'Error while fetching user data'});
  }
})

module.exports = router;