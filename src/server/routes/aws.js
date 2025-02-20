const express = require("express")
const router = express.Router()

let awsSettings = {
  iamRoleArn: null
}

router.get("/", async (req, res) => {
    try {
      res.json(awsSettings)
    } catch (error) {
      console.error("Error fetching AWS settings:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  })

router.post("/", async (req, res) => {
  try {
    const { iamRoleArn } = req.body

    if (!iamRoleArn) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    awsSettings = { iamRoleArn }
    res.status(200).json({ message: "AWS settings updated successfully" })
  } catch (error) {
    console.error("Error saving AWS settings:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
