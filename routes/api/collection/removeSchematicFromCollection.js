const express = require('express');
const { removeFromCloudinary } = require('../../../services/cloudinary');
const router = express.Router();
const { ObjectId } = require('mongodb');
const Collection = require('../../../models/collection');
const User = require('../../../models/user');

const multer = require('multer');
const upload = multer();


router.post('/:id',
  upload.none(),
  async(req, res) => {
    try{
      const id = req.params.id
      const { collectionId } = req.body;
      // const sessionId = req.headers['authorization'];
      let result = await Collection.findOneAndUpdate(
        { _id: collectionId },
        { $pull: { schematics: id } },
        { new: true }
      )

      res.status(200).json({ message: 'Schematic removed from collection successfuly!', status: 200 });
    } catch(err){
      console.log(err)
      res.status(500).json({ message: 'Error while removing the schematic from collection', status: 500 });
    }
  }
)

module.exports = router;