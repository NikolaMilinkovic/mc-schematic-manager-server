const express = require("express");
const User = require("../../../models/user");
const StudioUser = require("../../../models/studioUser");
const Collection = require("../../../models/collection");
const Schematic = require("../../../models/schematic");
const router = express.Router();

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.pageSize) || DEFAULT_PAGE_SIZE),
    );
    const search = req.query.search?.trim() || "";

    const collection = await Collection.findOne({ _id: id })
      .select("-file -created_at -last_updated")
      .lean();

    if (!collection) {
      return res
        .status(404)
        .json({ message: `Collection with ID: ${id} not found.` });
    }

    const schematicFilter = { _id: { $in: collection.schematics } };
    if (search) {
      schematicFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    const [totalCount, schematics] = await Promise.all([
      Schematic.countDocuments(schematicFilter),
      Schematic.find(schematicFilter)
        .select("-file -created_at -last_updated")
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    res.status(200).json({
      collection: { ...collection, schematics },
      totalCount,
      page,
      pageSize,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error while fetching collection" });
  }
});

module.exports = router;
