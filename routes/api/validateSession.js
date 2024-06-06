const express = require('express');
const User = require('../../models/user')
const router = express.Router();

router.post('/', async(req, res) => {
  try{
    const sessionId = req.headers['authorization'];
    console.log(sessionId);
    if(!sessionId){
      return res.status(401).json({ message: 'Token not provided' });
    }
    const user = await User.findOne({ session_id: sessionId });
    
    if(!user){
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if(user){
      return res.status(200).json({ message: 'Token is valid' });
    }

    next();
  } catch(err){
    console.log(err);
    res.status(500).send('Error while comparing session id');
  }
})

module.exports = router;