const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchematicSchema = new Schema ({
  name: { type: String, required: true },
  tags: [String],
  created_at: { type: Date, required: true, default: Date.now() },
  original_file_name: { type: String },
  file: { type: Buffer, required: true, unique: true },
  fawe_string: { type: String, default: '' },
  last_updated: { type: Date, default: Date.now() },
})

SchematicSchema.index({ name: 1 }, { unique: true });
SchematicSchema.index({ file: 1 }, { unique: true });

module.exports = mongoose.model("Schematic", SchematicSchema);