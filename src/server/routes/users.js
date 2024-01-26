const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  const testUsers = ["user1", "user2", "user3"];
  res.send(testUsers);
});

module.exports = router;
