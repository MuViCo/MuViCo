const router = require("express").Router()
const Presentation = require("../models/presentation")
const User = require("../models/user")

router.post("/reset", async (request, response) => {
  await Presentation.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = router
