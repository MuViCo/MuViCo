/*
 * Refresh token utility: opaque random value, only its hash is stored in the
 * DB, kept in an httpOnly cookie scoped to /api/login.
 */
import crypto from "crypto"
import type { Response } from "express"

// Only the fields we actually touch, so we don't need a hard dependency on
// the full User model here.
interface RefreshableUser {
  refreshTokenHash?: string | null
  refreshTokenExpires?: Date | null
  save: () => Promise<unknown>
}

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken"
const REFRESH_TOKEN_COOKIE_PATH = "/api/login"
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex")

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: REFRESH_TOKEN_COOKIE_PATH,
  maxAge: REFRESH_TOKEN_TTL_MS,
})

// Only one refresh token is valid per user at a time.
export const issueRefreshToken = async (
  user: RefreshableUser,
  res: Response
) => {
  const rawToken = crypto.randomBytes(32).toString("hex")

  user.refreshTokenHash = hashToken(rawToken)
  user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  await user.save()

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, rawToken, cookieOptions())
}

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_TOKEN_COOKIE_PATH,
  })
}
