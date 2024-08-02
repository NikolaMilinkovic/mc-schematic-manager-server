const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const StudioUser = require('./models/studioUser')

// Passport Local Strategy
passport.use(
  new LocalStrategy(async(username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      const studioUser = await StudioUser.findOne({ username: username });
      if (!user && !studioUser) {
        console.log('NO USER FOUND')
        return done(null, false, { message: "Incorrect username" });
      }

      if(user){
        console.log('There is user')
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          console.log('WRONG PASSWORD')
          return done(null, false, { message: "Incorrect password" });
        } else {
          return done(null, user);
        }
      } else {
        console.log('There is studioUser')
        const match = await bcrypt.compare(password, studioUser.password);

        if (!match) {
          console.log('WRONG PASSWORD')
          return done(null, false, { message: "Incorrect password" });
        } else {
          return done(null, studioUser);
        }
      }
    } catch (err) {
      return done(err);
    }
  })
);

// Passport Serialization / Deserialization
passport.serializeUser(function(user, done) {
  done(null, user._id);
});
passport.deserializeUser(async function(id, done) {
  try {
    let user = await User.findById(id);
    if (!user) {
      user = await StudioUser.findById(id);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to initialize passport and session
function initializePassport(app) {
  app.use(require('express-session')({
    secret: 'potatoes',
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
}

// Login Route Handler
async function loginHandler(req, res) {
  try {
    let user;
    if (req.user.role === 'studio_user') {
      const studioUser = await StudioUser.findById(req.user._id);
      user = await User.findById(req.user.parent_user_id);

      const token = jwt.sign({ id: studioUser._id, username: studioUser.username }, 'potatoes', { expiresIn: '24h' });
      res.cookie('token', token, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });

      await updateUserSessionId(studioUser._id, token); // Update session_id before setting the cookie

      res.json({ message: 'Logged in successfully', token, user, studioUser });
    } else {
      user = req.user;
      const token = jwt.sign({ id: req.user._id, username: req.user.username }, 'potatoes', { expiresIn: '24h' });
      res.cookie('token', token, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });

      await updateUserSessionId(req.user._id, token); // Update session_id before setting the cookie

      res.json({ message: 'Logged in successfully', token, user });
    }
    
  } catch (err) {
    console.error('Error fetching parent user: ', err);
    return res.status(500).json({ message: 'Error fetching parent user', error: err.message });
  }
}

async function updateUserSessionId(id, token){
  const user = await User.findOne({ _id: id });
  if(!user){
    const studioUser = await StudioUser.findOne({ _id: id });
    studioUser.session_id = token;
    await studioUser.save();
  } else {
    user.session_id = token;
    await user.save();
  }
}

// JWT Authentication Middleware
function authenticateJWT(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    jwt.verify(token, 'potatoes', (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    console.log('AuthenticateJWT failed.')
    console.log('Token is:', token)
    res.sendStatus(401);
  }
}
// Logout Route Handler
function logoutHandler(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

module.exports = {
  initializePassport,
  authenticateJWT,
  loginHandler,
  logoutHandler,
};