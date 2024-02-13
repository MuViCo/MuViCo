const express = require("express");
const Presentation = require("../models/presentation");

const router = express.Router();

router.get("/:id", async (req, res) => {
    const presentation = await Presentation.findById(req.params.id);
    if (presentation) {
        res.json(presentation);
    } else {
        res.status(404).end();
    }
});

module.exports = router;