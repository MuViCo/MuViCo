const { test, describe, expect, beforeEach } = require("@playwright/test")

describe("Frontpage", () => {
  beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/")
  })

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/MuViCo/)
  })

  test("user can sign up", async ({ page }) => {
    await page.getByRole("button", { name: "Sign Up" }).click()
  })

  test("user can login", async ({ page }) => {
    await page.getByRole("button", { name: "Login" }).click()
  })
})
