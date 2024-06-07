const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

// Passport Local Strategy
passport.use(
  new LocalStrategy(async(username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        console.log('NO USER FOUND')
        return done(null, false, { message: "Incorrect username" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.log('WRONG PASSWORD')
        return done(null, false, { message: "Incorrect password" });
      }
      console.log('USER FOUND IN DB!')
      return done(null, user);
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
  try{
    const user = User.findById(id);
    done(null, user);
  } catch(err) {
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
function loginHandler(req, res) {
  const user = req.user;
  const token = jwt.sign({ id: user._id, username: user.username }, 'potatoes', { expiresIn: '24h' });
  res.cookie('token', token, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });

  res.json({ message: 'Logged in successfully', token, user: user });
  updateUserSessionId(user._id, token)
}

async function updateUserSessionId(id, token){
  const user = await User.findOne({ _id: id });
  user.session_id = token;
  await user.save();
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