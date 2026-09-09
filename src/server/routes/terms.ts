import express from "express"

const router = express.Router()

router.get("/", (req, res) => {
  res.send("Your terms and conditions content goes here")
})

export = router
