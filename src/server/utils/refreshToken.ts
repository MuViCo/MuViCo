/*
 * Refresh token utility: opaque random value, only its hash is stored in the
 * DB, kept in an httpOnly cookie scoped to /api/login.
 */
const crypto = require("crypto")

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken"
const REFRESH_TOKEN_COOKIE_PATH = "/api/login"
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex")

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: REFRESH_TOKEN_COOKIE_PATH,
  maxAge: REFRESH_TOKEN_TTL_MS,
})

// Only one refresh token is valid per user at a time.
const issueRefreshToken = async (user, res) => {
  const rawToken = crypto.randomBytes(32).toString("hex")

  user.refreshTokenHash = hashToken(rawToken)
  user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  await user.save()

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, rawToken, cookieOptions())
}

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_TOKEN_COOKIE_PATH,
  })
}

module.exports = {
  REFRESH_TOKEN_COOKIE_NAME,
  hashToken,
  issueRefreshToken,
  clearRefreshTokenCookie,
}
