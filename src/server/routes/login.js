const jwt = require("jsonwebtoken")
const express = require("express")
const bcrypt = require("bcrypt")
const User = require("../models/user")
const config = require("../utils/config")
const verifyToken = require("../utils/verifyToken")

const router = express.Router()

router.post("/", async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
  /**
	 * Checks if the entered password is correct for the given user.
	 *
	 * @type {boolean}
	 */
  const passwordCorrect =
		user === null ? false : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: "invalid username or password",
    })
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  }

  const token = jwt.sign(userForToken, config.SECRET, {
    expiresIn: 60 * 60,
  })

  return res.status(200).send({
    token,
    username: user.username,
    name: user.name,
    isAdmin: user.isAdmin,
    id: user._id,
  })
})

router.post("/firebase", verifyToken, async (req, res) => {
  const { uid, email, name } = req.user


  try {
    const username = email ? email.split("@")[0] : `user_${uid}` 
    let user = await User.findOne({ username })
   
   
    if (!user) {
      user = new User({ uid, email, name, username })
      await user.save()
    }

    const userForToken = {
      username: user.username,
      id: user._id,
    }

  
    const token = jwt.sign(userForToken, config.SECRET, {
      expiresIn: 60 * 60,
    })

  
    return res.status(200).send({
      token,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
      id: user._id,
    })
    } catch (error) {
    res.status(500).json({ error: error.message })
    }
    })


module.exports = router
