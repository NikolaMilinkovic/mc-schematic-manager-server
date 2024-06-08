const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
  username: { type: String, required: [true, 'Please enter a valid username'], unique: [true, 'Username already registered'] },
  email: { type: String, unique: [true, 'Email already registered'] },
  password: { type: String, required: [true, 'Please enter a valid password'] },
  role: { type: String, required: [true, 'Please enter a valid role'] },
  session_id: { type: String, required: [true, 'Please provide a valid session id'], default: 'owner' },
  created_at: { type: Date, required: true, default: Date.now() },
  schematics: [{ type: Schema.Types.ObjectId, ref: 'Schematic' }],
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
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
  }
})

UserSchema.index({ schematics: 1 });

module.exports = mongoose.model("User", UserSchema);