const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const StudioUser = require('../models/studioUser')

const UserSchema = new Schema ({
  username: { type: String, required: [true, 'Please enter a valid username'], unique: [true, 'Username already registered'] },
  email: { type: String, unique: [true, 'Email already registered'] },
  password: { type: String, required: [true, 'Please enter a valid password'] },
  role: { type: String, required: [true, 'Please enter a valid role'], default: 'owner' },
  session_id: { type: String, required: [true, 'Please provide a valid session id'] },
  created_at: { type: Date, required: true, default: Date.now() },
  schematics: [{ type: Schema.Types.ObjectId, ref: 'Schematic' }],
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
  collection_tags: [{ type: String, unique: true }],
  avatar:{
    publicId:{
        type: String,
        required: true,
        default: 'mc-schematic-manager-images/xbcldkvm8tpj3dri4jgg'
    },
    url: {
        type: String,
        required: true,
        default: 'https://res.cloudinary.com/dm7ymtpki/image/upload/v1717774667/mc-schematic-manager-images/xbcldkvm8tpj3dri4jgg.jpg'
    },
  },
  studio: {
    name: {
      type: String,
      default: 'Set studio name here!'
    },
    users: [{ type: Schema.Types.ObjectId, ref: 'StudioUser' }],
  },
  permissions: {
    schematic: {
      get_schematic: {  type: Boolean, default: true },
      edit_schematic: {  type: Boolean, default: true },
      download_schematic: {  type: Boolean, default: true },
      remove_schematic: {  type: Boolean, default: true },
    },
    collection:{
      add_collection: {  type: Boolean, default: true },
      remove_collection: {  type: Boolean, default: true },
      edit_collection: {  type: Boolean, default: true },
    },
    profile: {
      view_profile: {  type: Boolean, default: true },
      edit_profile: {  type: Boolean, default: true },
      studio_user_manager: {  type: Boolean, default: true },
      view_user_stats: {  type: Boolean, default: true },
    }
  }
})

UserSchema.index({ schematics: 1 });

module.exports = mongoose.model("User", UserSchema);