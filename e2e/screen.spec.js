import { loginWith, addPresentation, addBlankCue } from "./helper"

const { test, describe, expect, beforeEach, chromium } = require("@playwright/test")

describe("Screen", () => {

  beforeEach(async ({ page, request }) => {
    await request.post("http:localhost:8000/api/testing/reset")
    await request.post("http:localhost:8000/api/signup", {
      data: {
        username: "screentestuser",
        password: "screentest",
      },
    })

    page.goto("http://localhost:3000/")
    await loginWith(page, "screentestuser", "screentest")
    await addPresentation(page, "testi")
    page.goto("http://localhost:3000/home")

  })

  test("user can press shift to display screen and cue info", async () => {
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page1 = await context.newPage()
    page1.goto("http://localhost:3000/")
    await loginWith(page1, "screentestuser", "screentest")
    page1.goto("http://localhost:3000/home")
    await page1.getByText("testi").click()
    await addBlankCue(page1, "test cue", "1", "1")
    await expect(page1.getByText("Cue test cue added to screen").first()).toBeVisible()
    await page1.getByRole("button", { name: "Show mode" }).click()
    const pagePromise = context.waitForEvent("page")
    await page1.getByRole("button", { name: "Open screen: 1" }).click()
    const page2 = await pagePromise
    await page1.keyboard.down("Shift")
    await expect(page2.getByText("Cue name: initial cue for screen 1")).toBeVisible()
  })
})


