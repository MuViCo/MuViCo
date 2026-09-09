import express from "express"

import Presentation from "../models/presentation"
import User from "../models/user"

const router = express.Router()

router.post("/reset", async (request, response) => {
  await Presentation.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

export = router
