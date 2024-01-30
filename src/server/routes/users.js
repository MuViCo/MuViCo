const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const mongoose = require('mongoose')

const router = express.Router()

router.get('/', async (req, res) => {
  const users = await User.find({})
  res.send(users.map((u) => u.toJSON()))
})

module.exports = router
