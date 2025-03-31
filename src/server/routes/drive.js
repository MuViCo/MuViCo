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

router.get("/image/:fileId", async (req, res) => {
  if (!storedDriveAccessToken) {
    return res.status(401).json({ error: "No access token stored" });
  }

  const fileId = req.params.fileId;
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  try {
    const response = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${storedDriveAccessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    res.set("Content-Type", response.headers.get("content-type"));
    response.body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch image from Google Drive" });
  }
})


module.exports = {
    router,
    getStoredDriveToken,
  }
  
