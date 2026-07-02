import { time } from "console"
import {
  loginWith,
  disableTutorials,
  addPresentation,
  addBlankCue,
} from "./helper"

const {
  test,
  describe,
  expect,
  beforeEach,
  chromium,
} = require("@playwright/test")

const testuser = "gridlayoutuser"
const testPw = "test12345"

const path = require("path")
const fs = require("fs")

describe("GridLayout", () => {
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
  })

  test("user can move cue", async ({ page }) => {
    await page.getByText("testi").click()

    await addBlankCue(page, "testcue", "1", "1")
    const source = page.locator('[data-testid="cue-testcue"]')

    const sourceBox = await source.boundingBox()
    if (!sourceBox) throw new Error("Source element bounding box not found")

    const anchorX = sourceBox.x + 150 / 2
    const anchorY = sourceBox.y + sourceBox.height / 2
    const targetX = anchorX + 160
    const targetY = anchorY + 110

    await page.mouse.move(anchorX, anchorY)
    await page.mouse.down()
    await page.mouse.move(targetX, targetY)
    await page.mouse.up()

    await expect(
      page.getByText("Element testcue updated on screen").first()
    ).toBeVisible()

    const movedId = await source.getAttribute("id")
    const [, newScreen, newIndex] = movedId.match(
      /cue-screen-(\d+)-index-(\d+)/
    )

    await page.reload()

    await addBlankCue(page, "testcue_ver", newIndex, newScreen)
    await expect(
      page
        .getByText(
          `Frame ${newIndex} element already exists on screen ${newScreen}. Do you want to replace it?`
        )
        .first()
    ).toBeVisible()
  })

  test("user can delete cue", async ({ page }) => {
    await page.getByText("testi").click()

    await addBlankCue(page, "testcue_del", "2", "2")

    const cue = page.locator('[data-testid="cue-testcue_del"]')
    await cue.hover()
    await cue.getByRole("button", { name: "Options" }).click()
    await page.getByRole("button", { name: `Delete testcue_del` }).click()

    await expect(
      page.getByText("Are you sure you want to remove this element?")
    ).toBeVisible()
    await page.getByRole("button", { name: "Yes" }).click()
  })

  test("should add a cue by dragging and dropping a file", async ({ page }) => {
    await page.getByText("testi").click()
    const dropArea = page.locator('[data-testid="drop-area"]')

    await addBlankCue(page, "testcue", "1", "1")
    const source = page.locator('[data-testid="cue-testcue"]')

    const filePath = path.resolve(
      __dirname,
      "../src/client/public/introvideopreview-light.png"
    )

    const buffer = fs.readFileSync(filePath)

    const dataTransfer = await page.evaluateHandle((data) => {
      const dt = new DataTransfer()
      const file = new File([data], "blank.png", { type: "image/png" })
      dt.items.add(file)
      return dt
    }, buffer)

    const sourceBox = await source.boundingBox()
    if (!sourceBox) throw new Error("Source element bounding box not found")

    const dropX = sourceBox.x + 300
    const dropY = sourceBox.y + 200

    await dropArea.dispatchEvent("dragenter", {
      clientX: dropX,
      clientY: dropY,
    })
    await dropArea.dispatchEvent("dragover", { clientX: dropX, clientY: dropY })
    await dropArea.dispatchEvent("drop", {
      clientX: dropX,
      clientY: dropY,
      dataTransfer,
    })

    await expect(
      page.getByText("Element blank.png added to screen 2").first()
    ).toBeVisible()
    await expect(page.locator('[data-testid="cue-blank.png"]')).toBeVisible()
  })

  test("user can rename cue", async ({ page }) => {
    await page.getByText("testi").click()
    await addBlankCue(page, "testcue", "1", "1")

    const cue = page.getByTestId("cue-testcue")
    await cue.hover()
    await cue.dblclick()

    await page.getByPlaceholder("Cue name").fill("testcue_renamed")
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("testcue_renamed")).toBeVisible()
  })

  test("user can add a cue by dragging a color from the media pool onto the grid", async ({
    page,
  }) => {
    await page.getByText("testi").click()
    await page.getByRole("button", { name: "Colors" }).click()
    await page.getByTestId("cue-name").fill("dragged cue")

    const source = page.locator(".droppable-color-element")
    const dropArea = page.locator('[data-testid="drop-area"]')
    const gridContainer = page.locator(
      '[data-testid="edit-mode-grid-container"]'
    )

    const sourceBox = await source.boundingBox()
    const containerBox = await gridContainer.boundingBox()
    const clientX = containerBox.x + 1 * 160 + 80
    const clientY = containerBox.y + 1 * 110 + 10

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
    await source.dispatchEvent("dragstart", {
      dataTransfer,
      clientX: sourceBox.x,
      clientY: sourceBox.y,
    })
    await dropArea.dispatchEvent("dragenter", {
      clientX,
      clientY,
      dataTransfer,
    })
    await dropArea.dispatchEvent("dragover", { clientX, clientY, dataTransfer })
    await dropArea.dispatchEvent("drop", { clientX, clientY, dataTransfer })

    await expect(
      page.getByText("Element dragged cue added to screen 1").first()
    ).toBeVisible()
    await expect(page.getByTestId("cue-dragged cue")).toBeVisible()
  })

  test("element is updated correctly", async ({ page }) => {
    await page.getByText("testi").click()

    // Add initial element
    await addBlankCue(page, "blank.png", "1", "1")
    await expect(
      page.getByText("Element blank.png added to screen 1").first()
    ).toBeVisible()
    await expect(page.locator('[data-testid="cue-blank.png"]')).toBeVisible()

    // Attempt to add another element at the same position
    await addBlankCue(page, "test.png", "1", "1")

    // Confirm the update
    await page.getByRole("button", { name: "Yes" }).click()

    await expect(
      page.getByText("Element test.png updated on screen 1").first()
    ).toBeVisible()
    await expect(page.locator('[data-testid="cue-test.png"]')).toBeVisible()
  })

  test("user can add new screen", async ({ page }) => {
    await page.getByText("testi").click()

    await expect(page.getByText("Screen 1", { exact: true })).toBeVisible()
    await expect(page.getByText("Screen 2", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Mute/unmute audio" })
    ).toBeVisible()
    await expect(page.getByText("Screen 3", { exact: true })).not.toBeVisible()

    const addButton = page.getByRole("button", { name: "Add screen" })
    await expect(addButton).toBeVisible()
    await addButton.click()

    await expect(page.getByText("Screen added").first()).toBeVisible()
    await expect(page.getByText("Screen 3", { exact: true })).toBeVisible()

    await expect(page.getByRole("button", { name: "Add screen" })).toBeVisible()
  })

  test("user can remove screen", async ({ page }) => {
    await page.getByText("testi").click()

    await expect(page.getByText("Screen 2", { exact: true })).toBeVisible()

    const removeButton = page.getByRole("button", { name: "Remove screen" })
    await expect(removeButton).toBeVisible()
    await removeButton.click()

    await expect(
      page.getByText(
        "Screen 2 has existing elements. Deleting this screen will also delete all elements on this screen. Delete anyway?"
      )
    ).toBeVisible()
    await page.getByRole("button", { name: "Yes" }).click()

    await expect(page.getByText("Screen removed").first()).toBeVisible()
    await expect(page.getByText("Screen removed").first()).not.toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByText("Screen 2", { exact: true })).not.toBeVisible()
    await expect(page.getByText("Screen 1", { exact: true })).toBeVisible()
  })

  test("user can remove screen with cues", async ({ page }) => {
    await page.getByText("testi").click()

    const addButton = page.getByRole("button", { name: "Add screen" })
    await addButton.click()
    await expect(page.getByText("Screen 3", { exact: true })).toBeVisible()

    await addBlankCue(page, "testcue", "1", "3")

    const removeButton = page.getByRole("button", { name: "Remove screen" })
    await expect(removeButton).toBeVisible()
    await removeButton.click()

    await expect(
      page.getByText(
        "Screen 3 has existing elements. Deleting this screen will also delete all elements on this screen. Delete anyway?"
      )
    ).toBeVisible()
    await page.getByRole("button", { name: "Yes" }).click()

    await expect(page.getByText("Screen removed").first()).toBeVisible()
    await expect(page.getByText("Screen removed").first()).not.toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByText("Screen 3", { exact: true })).not.toBeVisible()
    await expect(page.getByText("Screen 2", { exact: true })).toBeVisible()
  })

  test("new screen gets initial element", async ({ page }) => {
    await page.getByText("testi").click()

    const addButton = page.getByRole("button", { name: "Add screen" })
    await addButton.click()
    await expect(page.getByText("Screen 3", { exact: true })).toBeVisible()

    const initialElementTestId = `cue-initial element for screen ${3}`
    await page
      .getByTestId(initialElementTestId)
      .waitFor({ state: "visible", timeout: 20000 })

    await expect(page.getByText("Screen added").first()).toBeVisible()
  })

  test("screen management buttons only show on last screen", async ({
    page,
  }) => {
    await page.getByText("testi").click()

    await expect(page.getByRole("button", { name: "Add screen" })).toHaveCount(
      1
    )
    await expect(
      page.getByRole("button", { name: "Remove screen" })
    ).toHaveCount(1)
  })
})
