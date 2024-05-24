const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// const authRoutes = require('./routes/auth/login');
// const protectedRoute = require('./routes/protectedRoute');

const app = express();
// const corsOptions = {
//   origin: 'http://localhost:3000/',
//   optionsSuccessStatus: 200 
// }
// app.use(cors(corsOptions));
app.use(cors());
app.options('*', cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// ===============[ MongoDB connection ]=============== //
const conn_string = process.env.DB_CONN;
mongoose.connect(conn_string);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));

// Runs once to add a new document in MongoDB
db.once('open', async () => {
  try {
    const hashedPassword = await bcrypt.hash('gstb1337', 10);
    const newUser = new User({ username: 'Zaggy', password: hashedPassword });
    await newUser.save();
    console.log('User document inserted');
  } catch (err) {
    console.error('Error inserting user document:', err);
  }
});
// ===============[ \MongoDB connection ]=============== //



// =====================[ PASSPORT AUTHENTICATION ]=====================
// Imports Passport Auth methods from passport.js
// const passportAuth = require('./passport');
// =====================[ \PASSPORT AUTHENTICATION ]=====================



// =====================[ ROUTES ]=====================
// const indexRouter = require('./routes/index');
// const loginRouter = require('./routes/auth/login')
// app.use('/', loginRouter);
// =====================[ \ROUTES ]=====================


// =====================[ AUTH ]=====================
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

app.use(session({ secret: 'potatoes', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  const user = req.user;
  const token = jwt.sign({ id: user._id, username: user.username }, 'potatoes', { expiresIn: '24h' });
  res.cookie('token', token, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
  res.json({ message: 'Logged in successfully', token });
});

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

app.get('/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});
// =====================[ \AUTH ]=====================


// =====================[ ERROR HANDLERS ]=====================
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// =====================[ \ERROR HANDLERS ]=====================

module.exports = app;
