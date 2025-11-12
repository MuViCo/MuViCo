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

  describe("Screen titles", () => {


    test("user can see in the screen window title the screen number and the current frame number", async ({ page, context }) => {
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

      await expect(popup).toHaveTitle("Screen 2 • Frame 4")
    })

    test("user can see the window title to show the last frame number that has an element", async ({ page, context }) => {
      await addPresentation(page, "title-test", 4)

      await page.goto("http://localhost:3000/home")
      await page.getByText("title-test").click()
      await addBlankCue(page, "test cue", "0", "2")
      await page.getByRole("button", { name: "Show mode" }).click()
      //Goes to frame 4
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("ArrowRight")
      }
      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "Open Screen: 2" }).click(),
      ]);

      //Title shows starting frame because there the last element
      await expect(popup).toHaveTitle("Screen 2 • Starting Frame");
    })
  })
  describe("Open screens", () => {
    test("user can open all screens that have content", async ({ page, context }) => {
      await addPresentation(page, "title-test", 4)

      await page.goto("http://localhost:3000/home")
      await page.getByText("title-test").click()
      await addBlankCue(page, "test cue", "0", "2")
      await addBlankCue(page, "test cue2", "4", "3")
      await addBlankCue(page, "test cue2", "4", "4")
      await page.getByRole("button", { name: "Show mode" }).click()
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("ArrowRight")
      }

      //Opens three screen because there are elements in three different screens
      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "Open all screens" }).click(),
      ])

      await page.waitForFunction(
        () => window.contextPagesCount === undefined,
        { timeout: 100 }
      );
    
      const pages = context.pages();
      expect(pages.length).toBe(4);
    
    })

    test("user can open screen and close it", async ({ page, context }) => {
      await addPresentation(page, "title-test", 4)

      await page.goto("http://localhost:3000/home")
      await page.getByText("title-test").click()
      await addBlankCue(page, "test cue", "0", "2")
      await page.getByRole("button", { name: "Show mode" }).click()
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("ArrowRight")
      }
      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByRole("button", { name: "Open Screen: 2" }).click(),
      ]);

      await expect(popup).toHaveTitle("Screen 2 • Starting Frame");

      const closePromise = popup.waitForEvent("close").catch(() => null);
      await page.getByRole("button", { name: "Close Screen: 2" }).click();

      // Wait a bit and check if the page actually closed
      await Promise.race([
        closePromise,
        page.waitForTimeout(2000)
      ]);

      const pages = context.pages();
      expect(pages.includes(popup)).toBeFalsy();
    })
})
})