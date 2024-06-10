const express = require('express');
const User = require('../../models/user');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const sessionId = req.headers['authorization'];
    console.log(req.body);
    const user = await User.findOne({ session_id: sessionId });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error while fetching user data' });
  }
});

module.exports = router;
