import { loginWith, disableTutorials } from "./helper"

const { test, describe, expect, beforeEach } = require("@playwright/test")

const testuser = "profiletestuser"
const testPw = "test12345"

describe("Profile page", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http:localhost:8000/api/testing/reset")
    await request.post("http:localhost:8000/api/signup", {
      data: {
        username: testuser,
        password: testPw,
      },
    })
    await page.goto("http://localhost:3000/")
    await disableTutorials(page)
    await loginWith(page, testuser, testPw)
    await page.goto("http://localhost:3000/profile")
  })

  test("user can view their account information", async ({ page }) => {
    await expect(page.getByText("Account Information")).toBeVisible()
    await expect(page.getByText(testuser)).toBeVisible()
  })

  test("user can change their password successfully", async ({ page }) => {
    await page.getByTestId("current-password-input").fill(testPw)
    await page.getByTestId("new-password-input").fill("newpass123")
    await page.getByTestId("confirm-password-input").fill("newpass123")
    await page.getByRole("button", { name: "Confirm changes" }).click()

    await expect(page.getByText("Success").first()).toBeVisible()
    await expect(
      page.getByText("Password changed successfully").first()
    ).toBeVisible()
  })

  test("mismatched confirm password shows a validation error", async ({
    page,
  }) => {
    await page.getByTestId("current-password-input").fill(testPw)
    await page.getByTestId("new-password-input").fill("newpass123")
    await page.getByTestId("confirm-password-input").fill("somethingelse123")
    await page.getByRole("button", { name: "Confirm changes" }).click()

    await expect(page.getByText("New passwords do not match")).toBeVisible()
  })

  test("wrong current password shows an API error toast", async ({ page }) => {
    await page.getByTestId("current-password-input").fill("wrongpassword123")
    await page.getByTestId("new-password-input").fill("newpass123")
    await page.getByTestId("confirm-password-input").fill("newpass123")
    await page.getByRole("button", { name: "Confirm changes" }).click()

    await expect(page.getByText("Error").first()).toBeVisible()
    await expect(
      page.getByText("Current password is not valid").first()
    ).toBeVisible()
  })
})
