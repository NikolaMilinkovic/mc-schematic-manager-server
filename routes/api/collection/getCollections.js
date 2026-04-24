const express = require("express");
const User = require("../../../models/user");
const StudioUser = require("../../../models/studioUser");
const Collection = require("../../../models/collection");
const router = express.Router();

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

router.get("/", async (req, res) => {
  try {
    const sessionId = req.headers["authorization"];
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.pageSize) || DEFAULT_PAGE_SIZE),
    );
    const search = req.query.search?.trim() || "";

    let user;
    if (req.user.role === "studio_user") {
      user = await User.findOne({ _id: req.user.parent_user_id }).select(
        "collections",
      );
    } else {
      user = await User.findOne({ session_id: sessionId }).select(
        "collections",
      );
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const collectionFilter = { _id: { $in: user.collections } };
    if (search) {
      collectionFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    const [totalCount, collections] = await Promise.all([
      Collection.countDocuments(collectionFilter),
      Collection.find(collectionFilter)
        .select("-file -created_at -last_updated")
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    res.status(200).json({ collections, totalCount, page, pageSize });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error while fetching collections" });
  }
});

module.exports = router;
