const express = require('express');
const router = express.Router();
const { body , validationResult } = require('express-validator');

router.post('/', 
  [
    body('token').notEmpty().withMessage('Token is required!').escape()
  ],
  async(req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body
    if (!token){
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      clientLogin(token);
      res.status(200).json({ message: "Client was created." });
    } catch(err){
      console.log(err)
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
  }
)

module.exports = router;
