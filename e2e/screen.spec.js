import { loginWith, addPresentation, addBlankCue } from "./helper"
const { test, describe, expect, beforeEach } = require("@playwright/test")

describe("Screen", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http://localhost:8000/api/testing/reset")
    await request.post("http://localhost:8000/api/signup", {
      data: {
        username: "screentestuser",
        password: "screentest",
      },
    })

    await page.goto("http://localhost:3000/")
    await loginWith(page, "screentestuser", "screentest")
  })

  describe("Screen titles")

    test("screen window title shows screen number and starting frame", async ({ page, context }) => {
      await addPresentation(page, "title-test")

      await page.goto("http://localhost:3000/home")
      await page.getByText("title-test").click()
      await addBlankCue(page, "test cue", "0", "1")
      await page.getByRole("button", { name: "Show mode" }).click()

      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "Open screen: 1" }).click(),
      ])

      await expect(popup).toHaveTitle("Screen 1, Starting Frame")
    })

    test("screen window title shows screen number and the last frame number that has an element", async ({ page, context }) => {
      await addPresentation(page, "title-test")

      await page.goto("http://localhost:3000/home")
      await page.getByText("title-test").click()
      await addBlankCue(page, "test cue", "0", "2")
      await page.getByRole("button", { name: "Show mode" }).click()
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("ArrowRight")
      }

      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "Open screen: 2" }).click(),
      ])

      await expect(popup).toHaveTitle("Screen 2, Starting Frame")
    })

    test("screen window title shows screen number and the current frame number", async ({ page, context }) => {
      await addPresentation(page, "title-test")

      await page.goto("http://localhost:3000/home")
      await page.getByText("title-test").click()
      await addBlankCue(page, "test cue", "4", "2")
      await page.getByRole("button", { name: "Show mode" }).click()
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("ArrowRight")
      }

      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "Open screen: 2" }).click(),
      ])

      await expect(popup).toHaveTitle("Screen 2, Frame 4")
    })

    test("open all screens and check titles", async ({ page, context }) => {
      await addPresentation(page, "title-test")

      await page.goto("http://localhost:3000/home")
      await page.getByText("title-test").click()
      await addBlankCue(page, "test cue", "4", "2")
      await page.getByRole("button", { name: "Show mode" }).click()
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("ArrowRight")
      }

      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "Open screen: 2" }).click(),
      ])

      await expect(popup).toHaveTitle("Screen 2, Frame 4")
    })
})
