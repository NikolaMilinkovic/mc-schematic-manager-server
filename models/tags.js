const mongoose = require('mongoose');

const tagsSchema = new mongoose.Schema({
  tags: [{ type: String, unique: true }]
});

const Tags = mongoose.model('Tags', tagsSchema);

module.exports = Tags;