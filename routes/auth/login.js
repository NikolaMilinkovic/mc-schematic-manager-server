const express = require('express');
const router = express.Router();

// router.post('/', async(req, res) => {
//   const { token } = req.body
//   if (!token){
//     return res.status(401).json({ message: "Unaothorized" });
//   }

//   try {
//     clientLogin(token);
//     res.status(200).json({ message: "Client was created." });
//   } catch(err){
//     console.log(err)
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// })

module.exports = router;
