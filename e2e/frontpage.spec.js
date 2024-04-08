const { test, describe, expect, beforeEach } = require("@playwright/test")

describe("Frontpage", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http:localhost:8000/api/testing/reset")
    await request.post("http:localhost:8000/api/signup", {
      data: {
        username: "ttttt",
        password: "test",
      },
    })
    await page.goto("http://localhost:3000/")
  })

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/MuViCo/)
  })

  test("user can sign up", async ({ page }) => {
    await page.getByRole("button", { name: "Sign Up" }).click()
    await page.getByTestId("username_signup").fill("test")
    await page.getByTestId("password_signup").fill("test")
    await page.getByTestId("password_signup_confirmation").fill("test")
    await page.getByTestId("signup_inform").click()
  })

  test("user can login", async ({ page }) => {
    await page.getByRole("button", { name: "Login" }).click()
    await page.getByTestId("username_login").fill("testuser")
    await page.getByTestId("password_login").fill("test")
    await page.getByTestId("login_inform").click()
    await expect(page).toHaveText("/Presentations/")
  })
})
