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
const authModule = require('./authModule');

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
// db.once('open', async () => {
//   try {
//     const hashedPassword = await bcrypt.hash('gstb1337', 10);
//     const newUser = new User({ username: 'Zaggy', password: hashedPassword });
//     await newUser.save();
//     console.log('User document inserted');
//   } catch (err) {
//     console.error('Error inserting user document:', err);
//   }
// });
// ===============[ \MongoDB connection ]=============== //



// =====================[ PASSPORT/JWT AUTHENTICATION ]=====================
authModule.initializePassport(app);
// =====================[ \PASSPORT/JWT AUTHENTICATION ]=====================



// =====================[ ROUTES ]=====================
app.post('/login', passport.authenticate('local', { session: false }), authModule.loginHandler);
app.get('/protected', authModule.authenticateJWT, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});
app.post('/logout', authModule.logoutHandler);

const uploadRoute = require('./routes/api/faweUploadSchematic');
app.use('/upload', uploadRoute);

const uploadSchematic = require('./routes/api/uploadSchematic');
app.use('/upload-schematic', uploadSchematic)

const getAllSchematics = require('./routes/api/getAllSchematics');
app.use('/get-schematics', getAllSchematics)

const getAllTags = require('./routes/api/getAllTags');
app.use('/get-tags', getAllTags)

const getSchematicFile = require('./routes/api/getSchematicFile');
app.use('/get-schematic-file/', getSchematicFile)

const getSchematicFAWEString = require('./routes/api/getSchematicFAWEString');
app.use('/get-schematic-fawe-string/', getSchematicFAWEString)

const removeSchematic = require('./routes/api/removeSchematic');
app.use('/remove-schematic/', removeSchematic)
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
