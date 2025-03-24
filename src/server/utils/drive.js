// src/server/utils/drive.js
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");
const { Readable } = require("stream");

// Replace these with your actual credentials (or load from environment variables)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // e.g., "http://localhost:3000/auth/google/callback"

// Create a reusable OAuth2 client instance
const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function driveAuth(accessToken, refreshToken = null) {
  // Set the credentials on the OAuth2Client instance.
  oauth2Client.setCredentials({
    access_token: accessToken,
    // Optionally include a refresh token if available.
    refresh_token: refreshToken,
  });
  // Create a Drive API service instance with the authenticated client.
  return google.drive({ version: "v3", auth: oauth2Client });
}

async function uploadFile(fileBuffer, fileName, mimeType, accessToken) {
  try {
    const drive = driveAuth(accessToken);
    const bufferStream = Readable.from(fileBuffer);
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Drive upload error:", error);
    throw error;
  }
}

module.exports = { driveAuth, uploadFile };
