import { time } from "console"
import { loginWith, addPresentation, addBlankCue } from "./helper"

const { test, describe, expect, beforeEach, chromium } = require("@playwright/test")

const path = require('path')
const fs = require('fs')

describe("GridLayout", () => {   
        beforeEach(async ({ page, request }) => {
            await request.post("http:localhost:8000/api/testing/reset")
            await request.post("http:localhost:8000/api/signup", {
              data: {
                username: "testuser",
                password: "test",
              },
            })
            page.goto("http://localhost:3000/")
            await loginWith(page, "testuser", "test")
            await addPresentation(page, "testi")
            page.goto("http://localhost:3000/home")
    })

    test("user can move cue", async ({ page }) => {
        await page.getByText("testi").click()
        
        await addBlankCue(page, "testcue", "1", "1")
        const source = page.locator('[data-testid="cue-testcue"]')

        const sourceBox = await source.boundingBox()
        if (!sourceBox) throw new Error("Source element bounding box not found")
        
        // index:2, screen:2
        const targetX = sourceBox.x + 300
        const targetY = sourceBox.y + 200

        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
        await page.mouse.down()
        await page.mouse.move(targetX, targetY)
        await page.mouse.up()
        page.reload()

        await addBlankCue(page, "testcue_ver", "2", "2")
        await expect(page.getByText("Element already exists on screen 2. Do you want to update it?").first()).toBeVisible()
    })

    test("user can delete cue", async ({ page }) => {
      await page.getByText("testi").click()
  
      await addBlankCue(page, "testcue_del", "3", "3")
      await page.getByRole("button", { name: "Delete testcue_del" }).click()
  
      // Interact with the ConfirmationDialog
      await expect(page.getByText("Are you sure you want to remove this element?")).toBeVisible()
      await page.getByRole('button', { name: 'Yes' }).click()
  
      await expect(page.locator('[data-testid="cue-testcue_del"]')).not.toBeVisible()
    })

    test('should add a cue by dragging and dropping a file', async ({ page }) => {

      await page.getByText("testi").click()
      const dropArea = page.locator('[data-testid="drop-area"]')

      await addBlankCue(page, "testcue", "1", "1")
      const source = page.locator('[data-testid="cue-testcue"]')

      const filePath = path.resolve(__dirname, '../src/client/public/blank.png')

      const buffer = fs.readFileSync(filePath)

      const dataTransfer = await page.evaluateHandle((data) => {
        const dt = new DataTransfer()
        const file = new File([data], 'blank.png', { type: 'image/png' })
        dt.items.add(file)
        return dt
      }, buffer)

      const sourceBox = await source.boundingBox()
      if (!sourceBox) throw new Error("Source element bounding box not found")

      const dropX = sourceBox.x + 300
      const dropY = sourceBox.y + 200

      await dropArea.dispatchEvent('dragenter', { clientX: dropX, clientY: dropY })
      await dropArea.dispatchEvent('dragover', { clientX: dropX, clientY: dropY })
      await dropArea.dispatchEvent('drop', { clientX: dropX, clientY: dropY, dataTransfer })

      await expect(page.getByText("Element blank.png added to screen 2").first()).toBeVisible()
      await expect(page.locator('[data-testid="cue-blank.png"]')).toBeVisible()
    })

    test('user can rename cue', async ({ page }) => {
        await page.getByText("testi").click()
        await addBlankCue(page, "testcue", "1", "1")

        const cue = page.getByTestId('cue-testcue')
        await cue.hover()
        await cue.dblclick()

        await page.getByTestId('cue-name').fill("testcue_renamed")
        await page.getByText('Submit').click()

        await expect(page.getByText("testcue_renamed")).toBeVisible()
    })

    test('double click on empty space should open add element view', async ({ page }) => {
        await page.getByText("testi").click()
        const grid = page.locator('[data-testid="drop-area"]')
        var box = (await grid.boundingBox())

        await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2)
        await expect(page.getByRole("heading", { name: "Add element" })).toBeVisible()
    })

    test("element is updated correctly", async ({ page }) => {
      await page.getByText("testi").click()
  
      // Add initial element
      await addBlankCue(page, "blank.png", "1", "1")
      await expect(page.getByText("Element blank.png added to screen 1").first()).toBeVisible()
      await expect(page.locator('[data-testid="cue-blank.png"]')).toBeVisible()
  
      // Attempt to add another element at the same position
      await addBlankCue(page, "test.png", "1", "1")
  
      // Confirm the update
      await page.getByRole('button', { name: 'Yes' }).click()
  
      await expect(page.getByText("Element test.png updated on screen 1").first()).toBeVisible()
      await expect(page.locator('[data-testid="cue-test.png"]')).toBeVisible()
    })

    test("user can add new screen", async ({ page }) => {
        await page.getByText("testi").click()

        await expect(page.getByText("Screen 1")).toBeVisible()
        await expect(page.getByText("Screen 2")).toBeVisible()
        await expect(page.getByText("Screen 3")).toBeVisible()
        await expect(page.getByText("Audio files")).toBeVisible()
        await expect(page.getByText("Screen 4")).not.toBeVisible()

        const addButton = page.getByRole("button", { name: "Add screen" })
        await expect(addButton).toBeVisible()
        await addButton.click()

        await expect(page.getByText("Screen added")).toBeVisible()
        await expect(page.getByText("Screen 4")).toBeVisible()

        const screen4Area = page.getByText("Screen 4").locator("..")
        await expect(screen4Area.getByRole("button", { name: "Add screen" })).toBeVisible()
    })

    test("user can remove screen", async ({ page }) => {
        await page.getByText("testi").click()
        
        const addButton = page.getByRole("button", { name: "Add screen" })
        await addButton.click()
        await expect(page.getByText("Screen 4")).toBeVisible()

        const removeButton = page.getByRole("button", { name: "Remove screen" })
        await expect(removeButton).toBeVisible()
        await removeButton.click()

        await expect(page.getByText("Screen removed")).toBeVisible()
        await expect(page.getByText("Screen 4")).not.toBeVisible()
        await expect(page.getByText("Screen 3")).toBeVisible()
    })

    test("user can remove screen with cues", async ({ page }) => {
        await page.getByText("testi").click()
        
        await addBlankCue(page, "testcue", "0", "3")
        await expect(page.getByText("Element testcue added to screen 3")).toBeVisible()
        
        const removeButton = page.getByRole("button", { name: "Remove screen" })
        await removeButton.click()

        await expect(page.getByText("removed along with")).toBeVisible()
        await expect(page.getByText("Screen 3")).not.toBeVisible()
        
        await expect(page.locator('[data-testid="cue-testcue"]')).not.toBeVisible()
    })

    test("new screen gets initial element", async ({ page }) => {
        await page.getByText("testi").click()
        
        const addButton = page.getByRole("button", { name: "Add screen" })
        await addButton.click()
        await expect(page.getByText("Screen 4")).toBeVisible()

        await expect(page.getByText("Screen added")).toBeVisible()
        await expect(page.getByText("with initial element")).toBeVisible()
        
        const screen4Row = page.getByText("Screen 4").locator("../..")
        const initialElement = screen4Row.locator(".react-grid-item").first()
        await expect(initialElement).toBeVisible()
    })

    test("screen management buttons only show on last screen", async ({ page }) => {
        await page.getByText("testi").click()
        
        const screen1Area = page.getByText("Screen 1").locator("..")
        const screen2Area = page.getByText("Screen 2").locator("..")
        const screen3Area = page.getByText("Screen 3").locator("..")
        
        await expect(screen1Area.getByRole("button", { name: "Add screen" })).not.toBeVisible()
        await expect(screen2Area.getByRole("button", { name: "Add screen" })).not.toBeVisible()
        await expect(screen3Area.getByRole("button", { name: "Add screen" })).toBeVisible()
        
        await expect(screen1Area.getByRole("button", { name: "Remove screen" })).not.toBeVisible()
        await expect(screen2Area.getByRole("button", { name: "Remove screen" })).not.toBeVisible()
        await expect(screen3Area.getByRole("button", { name: "Remove screen" })).toBeVisible()
    })
})