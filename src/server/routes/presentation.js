const express = require("express")
const Presentation = require("../models/presentation")

const router = express.Router()

router.get("/:id", async (req, res) => {
  const presentation = await Presentation.findById(req.params.id)
  if (presentation) {
    res.json(presentation)
  } else {
    res.status(404).end()
  }
})

router.delete("/:id", async (req, res) => {
  Presentation.findByIdAndDelete(req.params.id).then(() => {
    res.status(204).end()
  })
})

module.exports = router
