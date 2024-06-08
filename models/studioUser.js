const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudioUserSchema = new Schema ({
  username: { type: String, required: [true, 'Please enter a valid username'], unique: [true, 'Username already registered'] },
  password: { type: String, required: [true, 'Please enter a valid password'] },
  custom_id: { type: String, required: [true, 'Please enter a valid custom id'] },
  role: { type: String, required: [true, 'Please enter a valid role'], default: 'studio_user' },
  session_id: { type: String, required: [true, 'Please provide a valid session id'], default: 'defaultSssionId' },
  created_at: { type: Date, required: true, default: Date.now() },
  parent_user_id: { type: Schema.Types.ObjectId, ref: 'User' },
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

module.exports = mongoose.model("StudioUser", StudioUserSchema);