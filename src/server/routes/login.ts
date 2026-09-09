/**
 * this module defines the routes for user login and authentication, including both traditional username/password login and Firebase-based authentication.
 * It uses JWT for token generation and includes error handling for invalid credentials. The routes interact with the User model to retrieve user data and manage authentication state.
 * The Firebase route also handles linking legacy accounts based on email prefixes to ensure a smooth transition for users authenticating with Google.
 */
import jwt from "jsonwebtoken"
import express from "express"

import { checkPassword } from "../utils/auth"
import User from "../models/user"
import * as config from "../utils/config"
import verifyToken from "../utils/verifyToken"
import { generateUniqueUsername } from "../utils/username"
import {
  REFRESH_TOKEN_COOKIE_NAME,
  hashToken,
  issueRefreshToken,
  clearRefreshTokenCookie,
} from "../utils/refreshToken"
import type { UserDocument } from "../types"

const router = express.Router()

// Kept short since this token authorizes every API call; /refresh below is
// what keeps users logged in longer.
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 60 * 60 // 1 hour

const signAccessToken = (user: UserDocument) =>
  jwt.sign({ username: user.username, id: user._id }, config.SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  })

router.post("/", async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
  /**

Checks if the entered password is correct for the given user.*
@type {boolean}*/
  const passwordCorrect =
    user === null
      ? false
      : await checkPassword(password, user.passwordHash as string)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: "invalid username or password",
    })
  }

  const token = signAccessToken(user)
  await issueRefreshToken(user, res)

  return res.status(200).send({
    token,
    username: user.username,
    // user.name was never a real field, this has always sent undefined
    name: (user as unknown as { name?: string }).name,
    isAdmin: user.isAdmin,
    id: user.id,
    driveToken: user.driveToken || null,
  })
})

router.post("/firebase", verifyToken, async (req, res) => {
  const { driveAccessToken } = req.body
  // req.user is the raw Firebase token here, not a User doc -- see verifyToken.ts
  const { uid, email } = req.user as unknown as { uid: string; email?: string }

  try {
    let user = await User.findOne({ firebaseUid: uid })

    if (!user) {
      const preferredUsername = email ? email.split("@")[0] : "user"
      /* Check for a legacy account with the same username (email prefix) that
         doesn't have a Firebase UID or password hash. Can be removed once
         all google users are identified with uid and not username. */
      const legacyCandidate = email
        ? await User.findOne({ username: preferredUsername })
        : null

      const isSafeLegacyAccount =
        legacyCandidate &&
        !legacyCandidate.firebaseUid &&
        !legacyCandidate.passwordHash

      // If such a legacy account exists, link it to the Firebase UID.
      if (isSafeLegacyAccount) {
        user = legacyCandidate
        // Otherwise, create a new account with a unique username.
      } else {
        const username = await generateUniqueUsername(preferredUsername, User)
        user = new User({ firebaseUid: uid, username })
      }
    }

    user.firebaseUid = uid

    if (driveAccessToken !== undefined) {
      user.driveToken = driveAccessToken
    }

    await user.save()

    const token = signAccessToken(user)
    await issueRefreshToken(user, res)

    return res.status(200).send({
      token,
      username: user.username,
      name: (user as unknown as { name?: string }).name,
      isAdmin: user.isAdmin,
      id: user._id,
      driveToken: user.driveToken,
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Rotates the refresh token on every use so an old one can't be replayed.
router.post("/refresh", async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]

  if (!rawToken) {
    return res.status(401).json({ error: "No refresh token" })
  }

  const user = await User.findOne({
    refreshTokenHash: hashToken(rawToken),
    refreshTokenExpires: { $gt: new Date() },
  })

  if (!user) {
    clearRefreshTokenCookie(res)
    return res.status(401).json({ error: "Invalid or expired refresh token" })
  }

  const token = signAccessToken(user)
  await issueRefreshToken(user, res)

  return res.status(200).json({ token })
})

router.post("/logout", async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]

  if (rawToken) {
    await User.findOneAndUpdate(
      { refreshTokenHash: hashToken(rawToken) },
      { refreshTokenHash: null, refreshTokenExpires: null }
    )
  }

  clearRefreshTokenCookie(res)
  return res.status(204).end()
})

export = router
