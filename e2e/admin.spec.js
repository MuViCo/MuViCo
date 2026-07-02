import { loginWith, disableTutorials } from "./helper"

const { test, describe, beforeEach } = require("@playwright/test")

const testuser = "admintestuser"
const testPw = "test12345"

describe("Route guards", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http://localhost:8000/api/testing/reset")
    await request.post("http://localhost:8000/api/signup", {
      data: {
        username: testuser,
        password: testPw,
      },
    })
    await page.goto("http://localhost:3000/")
    await disableTutorials(page)
  })

  test("non-admin user is redirected away from /users", async ({ page }) => {
    await loginWith(page, testuser, testPw)
    await page.goto("http://localhost:3000/users")
    await page.waitForURL("http://localhost:3000/")
  })

  test("unauthenticated user visiting /profile is redirected to the front page", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/profile")
    await page.waitForURL("http://localhost:3000/")
  })
})
