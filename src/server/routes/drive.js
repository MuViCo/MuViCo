// src/server/routes/presentation.js
const express = require("express");
const router = express.Router();

let storedDriveAccessToken = null

function getStoredDriveToken() {
  return storedDriveAccessToken
}

router.post("/", (req, res) => {
  const { driveAccessToken } = req.body;
  if (!driveAccessToken) {
    return res.status(400).json({ error: "No token provided" });
  }

  storedDriveAccessToken = driveAccessToken; // Save token
  console.log("Received Drive Access Token:", driveAccessToken);

  res.json({ message: "Token received successfully" });
});

// Example route where you might use the token
router.get("/", (req, res) => {
  if (!storedDriveAccessToken) {
    return res.status(404).json({ error: "No token stored" });
  }
  res.json({ driveAccessToken: storedDriveAccessToken });
});

module.exports = {
    router,
    getStoredDriveToken,
  }
  
