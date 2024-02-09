const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { userExtractor } = require("../utils/middleware");
const User = require("../models/user");
const Presentation = require("../models/presentation");
const logger = require("../utils/logger");

const router = express.Router();

router.get("/", async (req, res) => {
  const presentations = await Presentation.find({}).populate("user", {
    username: 1,
  });

  res.json(presentations.map((presentation) => presentation.toJSON()));
});

router.post("/", userExtractor, async (req, res) => {
  const { name } = req.body;

  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "operation not permitted" });
  }

  const presentation = new Presentation({
    name,
  });

  presentation.user = user._id;

  const createdPresentation = await presentation.save();

  user.presentations = user.presentations.concat(createdPresentation._id);
  await user.save();

  res.status(201).json();
});

router.get("/:id", async (req, res) => {
  const presentation = await Presentation.findById(req.params.id);
  if (presentation) {
    res.json(presentation);
  } else {
    res.status(404).end();
  }
});

module.exports = router;
