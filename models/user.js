const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
  username: { type: String, required: [true, 'Please enter a valid username'], unique: [true, 'Username already registered'] },
  password: { type: String, required: [true, 'Please enter a valid password'] },
  created_at: { type: Date, required: true, default: Date.now() },
})

module.exports = mongoose.model("User", UserSchema);