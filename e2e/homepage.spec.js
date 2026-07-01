import {
  loginWith,
  disableTutorials,
  addPresentation,
  addBlankCue,
} from "./helper"

const { test, describe, expect, beforeEach } = require("@playwright/test")

const testuser = "user1"
const testPw = "test12345"

describe("Homepage", () => {
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
    await addPresentation(page, "testi")
    await page.goto("http://localhost:3000/home")
    await addPresentation(page, "test_to_delete")
    await page.goto("http://localhost:3000/home")
  })

  test("user can add a presentation", async ({ page }) => {
    await addPresentation(page, "testpresentation")
    await expect(page.getByText("testpresentation")).toBeVisible()
  })

  test("user can enter a presentation", async ({ page }) => {
    const heading = page.getByText("testi")
    const card = heading.locator("..").locator("..")
    await expect(card).toBeVisible()
    await card.click()

    await expect(page.getByTestId("edit-mode-grid-container")).toBeVisible()
  })

  test("user can add blank cue", async ({ page }) => {
    await page.getByText("testi").click()
    await addBlankCue(page, "test cue", "1", "1")
    await expect(
      page.getByText("Element test cue added to screen").first()
    ).toBeVisible()
  })

  test("user can see per-screen open/close controls", async ({ page }) => {
    await page.getByText("testi").click()
    await addBlankCue(page, "test cue", "1", "1")
    await expect(
      page.getByText("Element test cue added to screen").first()
    ).toBeVisible()
    await expect(
      page
        .getByText("Screen 1", { exact: true })
        .locator("..")
        .getByRole("button", { name: "Open" })
    ).toBeVisible()
  })

  test("user can delete a presentation", async ({ page }) => {
    const heading = page.getByText("test_to_delete")
    const card = heading.locator("..").locator("..")
    await expect(card).toBeVisible()

    await card.getByRole("button", { name: "Delete presentation" }).click()

    const confirmYes = page.getByRole("button", { name: "Yes" })
    await expect(confirmYes).toBeVisible()
    await confirmYes.click()
    await expect(card).not.toBeVisible()
  })
})
