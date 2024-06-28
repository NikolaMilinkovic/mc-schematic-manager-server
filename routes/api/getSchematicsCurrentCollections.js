const express = require('express');
const User = require('../../models/user')
const StudioUser = require('../../models/studioUser');
const Collection = require('../../models/collection');
const router = express.Router();

router.get('/:id',
  async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    const schematicId = req.params.id;
    let user;
    let currentCollections = [];

    if(req.user.role === 'studio_user'){
      user = await User.findOne({ _id: req.user.parent_user_id })
        .populate({
          path: 'collections',
          select: 'name _id schematics'
        });
    } else {
      user = await User.findOne({ session_id: sessionId })
        .populate({
          path: 'collections',
          select: 'name _id schematics'
        });
    }

    if (!user) {
      return res.status(401).json({message: 'User not found'});
    }

    user.collections.forEach((collection) => {
      collection.schematics.forEach(schematic => {
        if (schematic.toString() === schematicId) {
          currentCollections.push({
            collection_name: collection.name,
            collection_id: collection._id
          });
        }
      });
    });

    if(user && currentCollections){
      res.json({ currentCollections });
    }

  } catch(err){
    console.log(err);
    res.status(500).json({message:'Error while fetching user data'});
  }
})

module.exports = router;