const User = require('../../models/user');
const StudioUser = require('../../models/studioUser');

async function authenticateUser(req, res, next) {
  try {
    const sessionId = req.headers['authorization'];
    console.log('sessionId is:', sessionId);
    if (!sessionId) {
      console.log('There is no sessionId found > meaning req.header[authorization] failed to provide.')
      console.log('sessionId is: ', sessionId);
      return res.status(401).json({ message: 'Token not provided' });
    }

    const user = await User.findOne({ session_id: sessionId });
    const studioUser = await StudioUser.findOne({ session_id: sessionId });

    if (!user && !studioUser) {
      console.log('There is no user or studio user found!')
      console.log(user)
      console.log(studioUser)
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if(user){
      req.user = user;
    } else {
      req.user = studioUser;
    }
    next();
  } catch (err) {
    console.error('Error while comparing session id', err);
    res.status(500).send('Error while comparing session id');
  }
}

module.exports = authenticateUser;
