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
  await Presentation.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

router.put("/:id", async (req, res) => {
  const { videoName, videoUrl } = req.body
  const updatedPresentation = await Presentation.findByIdAndUpdate(
    req.params.id,
    { $push: { files: { name: videoName, url: videoUrl } } },
    { new: true }
  )
  res.json(updatedPresentation)
  res.status(204).end()
})

router.delete("/:id/:fileId", async (req, res) => {
  const { id, fileId } = req.params
  const updatedPresentation = await Presentation.findByIdAndUpdate(
    id,
    { $pull: { files: { _id: fileId } } },
    { new: true }
  )
  res.json(updatedPresentation)
  res.status(204).end()
})

module.exports = router
