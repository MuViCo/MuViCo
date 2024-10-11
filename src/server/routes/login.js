const jwt = require("jsonwebtoken")
const express = require("express")
const bcrypt = require("bcrypt")
const { OAuth2Client } = require("google-auth-library")
const User = require("../models/user")
const config = require("../utils/config")
const passport = require("./googleAuth")

const router = express.Router()
const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)


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

router.post("/auth/google", async (req, res) => {
  const { tokenId } = req.body

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: config.GOOGLE_CLIENT_ID,
    })

    const { sub, email, name } = ticket.getPayload()
    let user = await User.findOne({ googleId: sub })

    if (!user) {
      user = new User({
        googleId: sub,
        username: name,
        email,
        isAdmin: false, // Default to non-admin, adjust as necessary
      })
      await user.save()
    }

    const userForToken = {
      username: user.username,
      id: user._id,
    }

    const token = jwt.sign(userForToken, config.SECRET, {
      expiresIn: 60 * 60,
    })

    res.status(200).send({
      token,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
    })
  } catch (error) {
    res.status(401).json({
      error: "Google authentication failed",
    })
  }
})


module.exports = router
