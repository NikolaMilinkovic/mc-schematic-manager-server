const express = require('express');
const { removeFromCloudinary } = require('../../../services/cloudinary');
const router = express.Router();
const { ObjectId } = require('mongodb');
const Collection = require('../../../models/collection');
const User = require('../../../models/user');


router.post('/:id',
  async(req, res) => {
    try{
      const id = req.params.id
      const cachedCollection = await Collection.findOne({ _id: id });
      const sessionId = req.headers['authorization'];
      
      if (!cachedCollection) {
        return res.status(404).send('Collection not found');
      }

      // Handle user
      const user = await User.findOneAndUpdate(
        { session_id: sessionId },
        { $pull: { collections: id } },
        { new: true }
      )
      if (!user) {
        return res.status(404).send('User not found');
      }

      // Handle collection
      const collection = await Collection.findOneAndDelete({ _id: id });
      if (!collection) {
        return res.status(404).send('Schematic not found');
      }

      // Removes the img from Cloudinary
      await removeFromCloudinary(cachedCollection.image.publicId);

      res.status(200).json({ message: 'Collection removed successfuly!', status: 200 });
    } catch(err){
      console.log(err)
      res.status(500).json({ message: 'Error while updating the profile', status: 500 });
    }
  }
)

module.exports = router;