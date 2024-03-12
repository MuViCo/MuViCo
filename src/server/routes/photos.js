const express = require("express")
const multer = require("multer")
const router = express.Router()
const path = require("path")
const fs = require("fs")

/**
 * Configure multer storage for uploaded files.
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"))
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})

/**
 * Initialize multer middleware for file upload.
 */
const upload = multer({ storage: storage })

/**
 * Handle file upload POST request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.post("/upload", upload.single("pic"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" })
  }
  console.log("File saved at:", req.file.path) // Log the path where the file is saved
  console.log("Photo uploaded successfully")
  res.status(200).json({ message: "File uploaded successfully" })
})

/**
 * Serve uploaded images by sending JSON response with image filenames.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/", (req, res) => {
  // Read the list of files in the uploads directory
  fs.readdir(path.join(__dirname, "uploads"), (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" })
    }
    // Send the list of image filenames as JSON response
    res.json(files)
  })
})

/**
 * Serve individual uploaded image by filename.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
router.get("/:imageName", (req, res) => {
  const imageName = req.params.imageName
  console.log(imageName)
  if (!imageName) {
    return res.status(400).json({ message: "Image name not provided" })
  }
  res.sendFile(path.join(__dirname, "uploads", imageName))
})

module.exports = router
