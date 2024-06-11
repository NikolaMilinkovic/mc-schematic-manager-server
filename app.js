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
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const authModule = require('./authModule');
const crypto = require('crypto');
const authenticateUser = require('./routes/api/authenticateUser');

const app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// ===============[ MongoDB connection ]=============== //
const conn_string = process.env.DATABASE_URL;
mongoose.connect(conn_string);
const db = mongoose.connection;
if(db){
  console.log('> Connected to DB')
}
db.on('error', console.error.bind(console, 'mongo connection error'));
// ===============[ \MongoDB connection ]=============== //

async function addUserOnStartup(username, plainPassword) {
  try {
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const newUser = new User({
        username,
        password: hashedPassword,
        session_id: 'test_session_id',
      });

      await newUser.save();
      console.log('User created');
    } else {
      console.log('User already exists');
    }
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Example usage
// addUserOnStartup('Helvos', 'jajesamcarsveta2');


app.use(session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.DATABASE_URL,
    ttl: 365 * 24 * 60 * 60 * 1000 // session TTL (optional)
  })
}));


// =====================[ PASSPORT/JWT AUTHENTICATION ]=====================
authModule.initializePassport(app);
// =====================[ \PASSPORT/JWT AUTHENTICATION ]=====================


// =====================[ ROUTES ]=====================
const validateLoginForm = [
  body('username').notEmpty().withMessage('Username is required').escape(),
  body('password').notEmpty().withMessage('Password is required')
]
app.post('/login', validateLoginForm,
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() })
    }
    next();
  },
  passport.authenticate('local', { session: false }), authModule.loginHandler);

const registerRoute = require('./routes/auth/registerUser');
app.use('/register', registerRoute);

app.get('/protected', authModule.authenticateJWT, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});
app.post('/logout', authModule.logoutHandler);

app.use(authenticateUser);
const uploadRoute = require('./routes/api/faweUploadSchematic');
app.use('/upload', authenticateUser, uploadRoute);

const uploadSchematic = require('./routes/api/uploadSchematic');
app.use('/upload-schematic', authenticateUser, uploadSchematic)

const updateSchematic = require('./routes/api/updateSchematic');
app.use('/update-schematic/', authenticateUser, updateSchematic);

const getAllSchematics = require('./routes/api/getAllSchematics');
app.use('/get-schematics', authenticateUser, getAllSchematics);

const getAllTags = require('./routes/api/getAllTags');
app.use('/get-tags', authenticateUser, getAllTags);

const getSchematicFile = require('./routes/api/getSchematicFile');
app.use('/get-schematic-file/', authenticateUser, getSchematicFile);

const getSchematic = require('./routes/api/getSchematic');
app.use('/get-schematic/', authenticateUser, getSchematic);

const getSchematicFAWEString = require('./routes/api/getSchematicFAWEString');
app.use('/get-schematic-fawe-string/', authenticateUser, getSchematicFAWEString)

const removeSchematic = require('./routes/api/removeSchematic');
app.use('/remove-schematic/', authenticateUser, removeSchematic)

const validateSession = require('./routes/api/validateSession');
app.use('/validate-session', authenticateUser, validateSession)

const updateProfile = require('./routes/api/updateProfile');
app.use('/update-profile', authenticateUser, updateProfile);

const getUserData = require('./routes/api/getUserData');
app.use('/get-user-data', authenticateUser, getUserData);

const getAllStudioUsers = require('./routes/api/getAllStudioUsers');
app.use('/get-all-studio-users', authenticateUser, getAllStudioUsers);

const updateStudioUsers = require('./routes/api/updateStudioUsers');
app.use('/update-studio-users', authenticateUser, updateStudioUsers);

const removeStudioUser = require('./routes/api/removeStudioUser');
app.use('/remove-studio-user', authenticateUser, removeStudioUser);

const getStudioOwnerData = require('./routes/api/getStudioOwnerData');
app.use('/get-studio-owner-data', authenticateUser, getStudioOwnerData);
// =====================[ \ROUTES ]=====================



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
