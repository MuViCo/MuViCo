const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.find({});
  res.send(users.map((u) => u.toJSON()));
});

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = new User({
      username,
      passwordHash,
    });

    const savedUser = await user.save({});

    res.status(201).json(savedUser);
  } catch {
    return res.status(401).json({ error: "Username already exists" });
  }
});

module.exports = router;
