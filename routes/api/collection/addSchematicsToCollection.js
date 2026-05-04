const express = require("express");
const mongoose = require("mongoose");
const User = require("../../../models/user");
const Collection = require("../../../models/collection");

const router = express.Router();

router.post("/:id", async (req, res) => {
  try {
    const sessionId = req.headers["authorization"];
    const { id: collectionId } = req.params;
    const { schematicIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({ message: "Invalid collection id." });
    }

    if (!Array.isArray(schematicIds)) {
      return res
        .status(400)
        .json({ message: "schematicIds must be an array." });
    }

    // Auth user
    let user;
    if (req.user?.role === "studio_user") {
      user = await User.findOne({ _id: req.user.parent_user_id }).select(
        "collections",
      );
    } else {
      user = await User.findOne({ session_id: sessionId }).select(
        "collections",
      );
    }

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Ownership guard
    const ownsCollection = (user.collections || []).some(
      (cid) => String(cid) === String(collectionId),
    );
    if (!ownsCollection) {
      return res.status(403).json({ message: "Collection not owned by user." });
    }

    // Normalize + dedupe + validate ObjectIds
    const normalizedIds = Array.from(
      new Set(
        schematicIds
          .map((id) => String(id))
          .filter((id) => mongoose.Types.ObjectId.isValid(id)),
      ),
    );

    const updated = await Collection.findOneAndUpdate(
      { _id: collectionId },
      {
        $set: {
          schematics: normalizedIds, // full replacement
          last_updated: new Date(),
        },
      },
      { new: true },
    )
      .select("-file -created_at")
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Collection not found." });
    }

    return res.status(200).json({
      message: "Collection schematics updated successfully.",
      collection: updated,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error while updating collection schematics.",
    });
  }
});

module.exports = router;
