const express = require('express');
const User = require('../../models/user');
const StudioUser = require('../../models/studioUser');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const sessionId = req.headers['authorization'];
    const studioUser = req.body;
    console.log(studioUser)
    const user = await User.findOne({ session_id: sessionId })
      .populate('studio.users');

    const index = user.studio.users.findIndex(user => user.custom_id === studioUser.customId);

    if(index !== -1){
      const id = user.studio.users[index]._id;
      const deletedStudioUser = await StudioUser.findOneAndDelete({ _id: id });
      user.studio.users.splice(index, 1)
      await user.save();

      return res.status(200).json({ message: 'User successfully removed.'})
    } else {

      return res.status(404).json({ message: 'User not found.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error while removing studio user.' });
  }
});

module.exports = router;
