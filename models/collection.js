const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CollectionSchema = new Schema ({
  name: { type: String, required: true },
  tags: [String],
  created_at: { type: Date, required: true, default: Date.now() },
  last_updated: { type: Date, default: Date.now() },
  schematics: [{ type: Schema.Types.ObjectId, ref: 'Schematic' }],
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


module.exports = mongoose.model("Collection", CollectionSchema);