const express = require("express")

const router = express.Router()

router.get("/", (req, res) => {
  res.send("Your terms and conditions content goes here")
})

module.exports = router
