const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { userExtractor } = require('../utils/middleware')
const User = require('../models/user')
const Presentation = require('../models/presentation') 

const router = express.Router()

router.get('/', async (req, res) => {
    const presentations = await Presentation
            .find({}).populate('user', { username: 1, name: 1 })

    res.json(presentations.map((presentation) => presentation.toJSON()))
})

router.post('/', userExtractor, async (req, res) => {
    const body = req.body
    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SERCRET)
    if (!decodedToken.id) {
        return res.status(401).json({ error: 'invalid token' })
    }

    const user = await User.findById(decodedToken.id)

    const presentation = new Presentation({
        presentationName: body.presentationName,
        user: user._id
    })

    const savedPresentation = await presentation.save()
    user.presentations = user.presentations.concat(savedPresentation._id)
    await user.save()

    res.json(savedPresentation.toJSON())
})




router.get('/:id', async (req, res) => {
    const presentation = await Presentation.findById(req.params.id)
    if (presentation) {
        res.json(presentation)
    } else {
        res.status(404).end()
    }

    
})


module.exports = router