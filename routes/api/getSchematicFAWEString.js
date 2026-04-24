const express = require("express");
const Schematic = require("../../models/schematic");
const router = express.Router();
const { getFAWEString } = require("../../FAWE_string");
const { check, validationResult } = require("express-validator");

router.get(
  "/:id",
  [
    check("id")
      .notEmpty()
      .withMessage("ID parameter must not be empty!")
      .escape(),
  ],
  async (req, res) => {
    // Validation of input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = req.params.id;
      const schematic = await Schematic.findById(id);
      if (!schematic) {
        return res.status(404).send("Schematic not found");
      }

      // Check for last update
      const currentDate = Date.now();
      const lastUpdated = new Date(schematic.last_updated);
      const daysDifference =
        (currentDate - lastUpdated) / (1000 * 60 * 60 * 24);

      // ===============[UPDATE THE STRING IF OUTDATED]===============
      if (daysDifference > 30) {
        const FAWE = await getFAWEString(
          schematic.original_file_name,
          schematic.file,
          req,
          res,
        );
        if (!FAWE) {
          return res
            .status(500)
            .json({ error: "Failed to retrieve redirect URL." });
        }

        schematic.fawe_string = `//schematic load ${FAWE.type} url:${FAWE.upload}`;
        schematic.last_updated = new Date();
        await schematic.save();

        console.log("> FAWE string returned successfully.");
        return res.send(schematic.fawe_string);
      } else {
        console.log("> FAWE string returned successfully.");
        // console.log(`Returning to user: ${schematic.fawe_string}`)
        return res.send(schematic.fawe_string);
      }
    } catch (error) {
      console.error("Error uploading file:", error.message);
      res.status(500).send("Error uploading file: " + error.message);
    }
  },
);

module.exports = router;
