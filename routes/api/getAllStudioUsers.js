const express = require('express');
const User = require('../../models/user')
const router = express.Router();

router.get('/', async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    console.log(sessionId)
    const studio_users = await User.findOne({ session_id: sessionId })
      .populate('studio.users')
      .exec()
    console.log(studio_users)

    res.status(200).json(studio_users);
  } catch(err){
    console.log(err);
    res.status(500).send('Error while fetching studio users');
  }
})

module.exports = router;