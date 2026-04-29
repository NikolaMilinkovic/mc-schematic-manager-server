const Schematic = require('../../../models/schematic');
const User = require('../../../models/user');
const StudioUser = require('../../../models/studioUser');
const Studio = require('../../../models/studio');
const Collection = require('../../../models/collection');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseCsvParam(value) {
  if (!value || typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function resolveStudioContext(req) {
  let actingUser = req.user;

  if (!actingUser) {
    return { ownerUser: null, studio: null };
  }

  if (actingUser.role === 'studio_user') {
    const studioUser = await StudioUser.findById(actingUser._id).select('parent_user_id');
    if (!studioUser?.parent_user_id) {
      return { ownerUser: null, studio: null };
    }

    actingUser = await User.findById(studioUser.parent_user_id);
  } else {
    actingUser = await User.findById(actingUser._id);
  }

  if (!actingUser) {
    return { ownerUser: null, studio: null };
  }

  const studio = await Studio.findOne({ owner_user_id: actingUser._id });
  return { ownerUser: actingUser, studio };
}

module.exports = {
  Schematic,
  User,
  Collection,
  escapeRegex,
  parseCsvParam,
  parseJsonArray,
  resolveStudioContext,
};
