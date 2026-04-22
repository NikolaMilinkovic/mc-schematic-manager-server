const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const StudioUser = require('../../models/studioUser');
const Schematic = require('../../models/schematic');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res) => {
  try {
    const sessionId = req.headers['authorization'];
    const userRole = req.user.role;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 24));
    const search = req.query.search?.trim() || '';
    const tags = req.query.tags
      ? req.query.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    let user;
    if (userRole && userRole === 'studio_user') {
      const studioUser = await StudioUser.findOne({ session_id: sessionId });
      user = await User.findOne({ _id: studioUser.parent_user_id }).select('schematics');
    } else {
      user = await User.findOne({ session_id: sessionId }).select('schematics');
    }

    if (!user) {
      return res.status(200).json({ schematics: [], totalCount: 0 });
    }

    const filter = { _id: { $in: user.schematics } };

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (tags.length > 0) {
      filter.tags = { $all: tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, 'i')) };
    }

    const [schematics, totalCount] = await Promise.all([
      Schematic.find(filter)
        .select('-file -fawe_string')
        .sort({ created_at: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      Schematic.countDocuments(filter),
    ]);

    return res.status(200).json({ schematics, totalCount });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error while fetching schematics');
  }
});

module.exports = router;