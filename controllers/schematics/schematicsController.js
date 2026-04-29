const uploadFawe = require('./methods/uploadFawe');
const uploadSchematic = require('./methods/uploadSchematic');
const updateSchematic = require('./methods/updateSchematic');
const removeSchematic = require('./methods/removeSchematic');
const getAllSchematics = require('./methods/getAllSchematics');
const getSchematic = require('./methods/getSchematic');
const getSchematicFile = require('./methods/getSchematicFile');
const getSchematicFAWEString = require('./methods/getSchematicFAWEString');
const getSchematicsCurrentCollections = require('./methods/getSchematicsCurrentCollections');
const getSchematicImageUrl = require('./methods/getSchematicImageUrl');
const getAllTags = require('./methods/getAllTags');

module.exports = {
  uploadFawe,
  uploadSchematic,
  updateSchematic,
  removeSchematic,
  getAllSchematics,
  getSchematic,
  getSchematicFile,
  getSchematicFAWEString,
  getSchematicsCurrentCollections,
  getSchematicImageUrl,
  getAllTags,
};
