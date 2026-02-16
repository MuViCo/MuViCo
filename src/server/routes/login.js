const jwt = require("jsonwebtoken")
const express = require("express")
const bcrypt = require("bcrypt")
const User = require("../models/user")
const config = require("../utils/config")
const verifyToken = require("../utils/verifyToken")
const { generateUniqueUsername } = require("../utils/username")

const router = express.Router()

router.post("/", async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
  /**
   
Checks if the entered password is correct for the given user.*
@type {boolean}*/
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
    id: user.id,
    driveToken: user.driveToken || null,
  })
})

router.post("/firebase", verifyToken, async (req, res) => {
  const { driveAccessToken } = req.body
  const { uid, email } = req.user

  try {
    let user = await User.findOne({ googleUid: uid })

    if (!user) {
      const preferredUsername = email ? email.split("@")[0] : "user"
      /* Check for a legacy account with the same username (email prefix) that
         doesn't have a Google UID or password hash. Can be removed once
         all google users are identified with uid and not username. */
      const legacyCandidate = email
        ? await User.findOne({ username: preferredUsername })
        : null

      const isSafeLegacyAccount =
        legacyCandidate &&
        !legacyCandidate.googleUid &&
        !legacyCandidate.passwordHash

      // If such a legacy account exists, link it to the Google UID. 
      if (isSafeLegacyAccount) {
        user = legacyCandidate
      // Otherwise, create a new account with a unique username.
      } else {
        const username = await generateUniqueUsername(preferredUsername, User)
        user = new User({ googleUid: uid, username })
      }
    }

    user.googleUid = uid

    if (driveAccessToken !== undefined) {
      user.driveToken = driveAccessToken
    }

    await user.save()

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
      driveToken: user.driveToken,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
