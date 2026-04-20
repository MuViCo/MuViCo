const { test, describe, expect, beforeEach } = require("@playwright/test")
import { loginWith } from "./helper"

const testuser = "tester"
const testPw = "test12345"

describe("Frontpage", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http:localhost:8000/api/testing/reset")
    await request.post("http:localhost:8000/api/signup", {
      data: {
        username: testuser,
        password: testPw,
      },
    })
    await page.goto("http://localhost:3000/")
  })

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/MuViCo/)
  })

  test("user can sign up", async ({ page }) => {
    await page.getByRole("button", { name: "Sign Up" }).click()
    await page.getByTestId("username_signup").fill(testuser)
    await page.getByTestId("password_signup").fill(testPw)
    await page.getByTestId("password_signup_confirmation").fill(testPw)
    await page.getByTestId("signup_inform").click()
  })

  test("user can login", async ({ page }) => {
    loginWith(page, testuser, testPw)
    await expect(page).toHaveURL(/\/home/)
    await expect(page.getByText("Welcome to MuViCo").first()).toBeDefined()
  })
})
