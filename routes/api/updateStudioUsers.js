const express = require('express');
const User = require('../../models/user');
const StudioUser = require('../../models/studioUser');
const schematic = require('../../models/schematic');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.post('/', async (req, res) => {
  try {
    const sessionId = req.headers['authorization'];
    const studioUsers = req.body; // Array of objects
    const user = await User.findOne({ session_id: sessionId })
      .populate('studio.users'); // Studio Owner
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    for (const studioUser of studioUsers) {
      const permissions = studioUser.permissions;
      const schematicPermissions = permissions.schematic;
      const collectionPermissions = permissions.collection;
      const profilePermissions = permissions.profile;

      const index = user.studio.users.findIndex(user => user.custom_id === studioUser.custom_id);

      if (index !== -1) {
        console.log('> Begin updating existing user...');
        const id = user.studio.users[index]._id;
        const updateUser = await StudioUser.findOne({ _id: id });
        if(studioUser.password !== updateUser.password){
          const hashedPassword = await bcrypt.hash(studioUser.password, 10);
          updateUser.password = hashedPassword;
        }
        updateUser.username = studioUser.username;
        updateUser.permissions.schematic = schematicPermissions;
        updateUser.permissions.collection = collectionPermissions;
        updateUser.permissions.profile = profilePermissions;
        await updateUser.save();
        console.log('> Updated an existing studio user');
      } else {
        console.log('> Begin adding new user...');
        const hashedPassword = await bcrypt.hash(studioUser.password, 10);
        const newStudioUser = new StudioUser({
          username: studioUser.username,
          password: hashedPassword,
          custom_id: studioUser.custom_id,
          role: studioUser.role,
          session_id: studioUser.session_id,
          created_at: studioUser.created_at,
          parent_user_id: studioUser.parent_user_id,
          schematics: [],
          avatar: studioUser.avatar,
          permissions: {
            schematic: schematicPermissions,
            collection: collectionPermissions,
            profile: profilePermissions,
          }
        });
        const createdStudioUser = await StudioUser.create(newStudioUser);
        user.studio.users.push(createdStudioUser._id);
        console.log('> Created new studio user');
      }
    }

    await user.save();
    res.status(200).json({ message: 'Studio Users successfully saved!' })
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error while fetching user data' });
  }
});

module.exports = router;
