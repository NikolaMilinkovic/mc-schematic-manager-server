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

const app = express();

const allowedOrigins = [
  'https://mc-schematic-manager.vercel.app',
  'https://mc-schematic-manager-server.adaptable.app',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

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

const updateSchematic = require('./routes/api/updateSchematic');
app.use('/update-schematic/', updateSchematic);

const getAllSchematics = require('./routes/api/getAllSchematics');
app.use('/get-schematics', getAllSchematics);

const getAllTags = require('./routes/api/getAllTags');
app.use('/get-tags', getAllTags);

const getSchematicFile = require('./routes/api/getSchematicFile');
app.use('/get-schematic-file/', getSchematicFile);

const getSchematic = require('./routes/api/getSchematic');
app.use('/get-schematic/', getSchematic);

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
