const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const credentials = req.body;
  res.send(JSON.stringify(credentials));
});

module.exports = router;
