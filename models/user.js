const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
  username: { type: String, required: [true, 'Please enter a valid username'], unique: [true, 'Username already registered'] },
  password: { type: String, required: [true, 'Please enter a valid password'] },
  session_id: { type: String, required: [true, 'Please provide a valid session id'] },
  created_at: { type: Date, required: true, default: Date.now() },
  schematics: [{ type: Schema.Types.ObjectId, ref: 'Schematic' }]
})

UserSchema.index({ schematics: 1 });

module.exports = mongoose.model("User", UserSchema);