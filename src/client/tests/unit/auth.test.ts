/*
 * Auth helper unit tests.
 * Covers reading the access token out of localStorage and the expiry check
 * applied to it, including the malformed-token path.
 */
import getToken, { isTokenExpired } from "../../auth"

/** Builds a JWT-shaped string whose payload carries the given exp claim. */
const tokenWithExp = (expSeconds: number): string => {
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
  return `header.${payload}.signature`
}

describe("getToken", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  test("returns the token of the stored user", () => {
    window.localStorage.setItem(
      "user",
      JSON.stringify({ token: "abc123", username: "tester" })
    )

    expect(getToken()).toBe("abc123")
  })

  test("returns null when no user is stored", () => {
    expect(getToken()).toBeNull()
  })
})

describe("isTokenExpired", () => {
  test("returns true when there is no token", () => {
    expect(isTokenExpired(null)).toBe(true)
    expect(isTokenExpired(undefined)).toBe(true)
    expect(isTokenExpired("")).toBe(true)
  })

  test("returns false for a token whose exp is in the future", () => {
    const oneHourAhead = Math.floor(Date.now() / 1000) + 3600

    expect(isTokenExpired(tokenWithExp(oneHourAhead))).toBe(false)
  })

  test("returns true for a token whose exp has passed", () => {
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600

    expect(isTokenExpired(tokenWithExp(oneHourAgo))).toBe(true)
  })

  test("treats a token it cannot decode as expired", () => {
    // Not base64, so atob throws and the catch decides the token is unusable
    // rather than letting the error escape to the caller.
    expect(isTokenExpired("not-a-jwt")).toBe(true)
    expect(isTokenExpired("header.!!!not-base64!!!.signature")).toBe(true)
  })
})
