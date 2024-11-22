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
        await expect(page.getByText("Element with index 2 already exists on screen 2").first()).toBeVisible()
    })

    test("user can delete cue", async ({ page }) => {
        await page.getByText("testi").click()

        await addBlankCue(page, "testcue_del", "3", "3")
        await page.getByRole("button", { name: "Delete testcue_del" }).click()

        page.once('dialog', async dialog => {
            expect(dialog.message()).toContain("Are you sure you want to delete this element?")
            await dialog.accept()
        })

        await page.locator('button[aria-label="Delete testcue_del"]').click()
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


})