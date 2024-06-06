const User = require('../../models/user');

async function authenticateUser(req, res, next) {
  try {
    const sessionId = req.headers['authorization'];
    console.log(req.headers)
    console.log('LOGGING SESSION ID')
    console.log(sessionId)
    if (!sessionId) {
      return res.status(401).json({ message: 'Token not provided' });
    }

    const user = await User.findOne({ session_id: sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error while comparing session id', err);
    res.status(500).send('Error while comparing session id');
  }
}

module.exports = authenticateUser;
