const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchematicSchema = new Schema ({
  name: { type: String, required: true },
  tags: [{ type: String }],
  created_at: { type: Date, required: true, default: Date.now() },
  original_file_name: { type: String },
  file: { type: Buffer, required: true },
  fawe_string: { type: String, default: '' },
  last_updated: { type: Date, default: Date.now() },
  image:{
    publicId:{
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    }
  },
  blur_hash:{
    hash:{
        type: String,
    },
    width:{
        type: Number,
    },
    height:{
        type: Number,
    }
  }
})

SchematicSchema.index({ name: 1 });
SchematicSchema.index({ file: 1 });

module.exports = mongoose.model("Schematic", SchematicSchema);