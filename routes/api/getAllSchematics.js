const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const StudioUser = require("../../models/studioUser");
const Schematic = require("../../models/schematic");
const Collection = require("../../models/collection");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCsvParam(value) {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

router.get("/", async (req, res) => {
  try {
    const sessionId = req.headers["authorization"];
    const userRole = req.user.role;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize, 10) || 100),
    );
    const search = req.query.search?.trim() || "";
    const tags = parseCsvParam(req.query.tags);
    const collections = parseCsvParam(req.query.collections);

    let user;
    if (userRole && userRole === "studio_user") {
      const studioUser = await StudioUser.findOne({
        session_id: sessionId,
      }).select("parent_user_id");

      if (!studioUser?.parent_user_id) {
        return res
          .status(200)
          .json({ schematics: [], totalCount: 0, page, pageSize });
      }

      user = await User.findOne({ _id: studioUser.parent_user_id }).select(
        "schematics",
      );
    } else {
      user = await User.findOne({ session_id: sessionId }).select("schematics");
    }

    if (!user?.schematics?.length) {
      return res
        .status(200)
        .json({ schematics: [], totalCount: 0, page, pageSize });
    }

    let schematicIds = user.schematics.map((id) => String(id));

    if (collections.length > 0) {
      const matchedCollections = await Collection.find({
        _id: { $in: collections },
      })
        .select("schematics")
        .lean();

      const collectionSchematicIds = new Set(
        matchedCollections.flatMap((collection) =>
          (collection.schematics || []).map((id) => String(id)),
        ),
      );

      schematicIds = schematicIds.filter((id) =>
        collectionSchematicIds.has(id),
      );

      if (schematicIds.length === 0) {
        return res
          .status(200)
          .json({ schematics: [], totalCount: 0, page, pageSize });
      }
    }

    const filter = { _id: { $in: schematicIds } };

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { tags: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (tags.length > 0) {
      filter.tags = {
        $in: tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, "i")),
      };
    }

    const [schematics, totalCount] = await Promise.all([
      Schematic.find(filter)
        .select("-file -fawe_string")
        .sort({ created_at: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      Schematic.countDocuments(filter),
    ]);

    return res.status(200).json({ schematics, totalCount, page, pageSize });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error while fetching schematics");
  }
});

module.exports = router;
