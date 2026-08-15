import {
  loginWith,
  disableTutorials,
  addPresentation,
  addBlankCue,
  uploadAudioFile,
  uploadMediaFile,
  dragPoolItemToGrid,
  openCueMenu,
} from "./helper"

const { test, describe, expect, beforeEach } = require("@playwright/test")

const testuser = "audiotestuser"
const testPw = "test12345"

// addPresentation(page, "testi") defaults to screenCount = 2.
// The helper coordinate includes the frame header offset; row coordinate 3 lands
// on timeline row index 2, which is audio track 1.
const AUDIO_TRACK_ROW = 3

describe("Audio cues", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http://localhost:8000/api/testing/reset")
    await request.post("http://localhost:8000/api/signup", {
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

  test("user can upload an audio file and drag it onto an audio track", async ({
    page,
  }) => {
    await page.getByText("testi").click()

    await uploadAudioFile(page, {
      name: "test-audio.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from("fake audio content"),
    })
    await expect(page.getByText("test-audio.mp3")).toBeVisible()

    await dragPoolItemToGrid(page, "test-audio.mp3", 1, AUDIO_TRACK_ROW)

    await expect(
      page.getByText("Element test-audio.mp3 added to audio track 1").first()
    ).toBeVisible()
    await expect(page.getByTestId("cue-test-audio.mp3")).toBeVisible()
  })

  test("dragging an audio file onto a screen row shows a validation toast", async ({
    page,
  }) => {
    await page.getByText("testi").click()

    await uploadAudioFile(page, {
      name: "wrong-row.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from("fake audio content"),
    })
    await dragPoolItemToGrid(page, "wrong-row.mp3", 1, 1)

    await expect(
      page.getByText("Only audio on audio rows").first()
    ).toBeVisible()
    await expect(
      page.getByText("Drag audio files to an audio track.").first()
    ).toBeVisible()
    await expect(page.getByTestId("cue-wrong-row.mp3")).not.toBeVisible()
  })

  test("dragging a media file onto an audio track shows a validation toast", async ({
    page,
  }) => {
    await page.getByText("testi").click()

    await uploadMediaFile(page, {
      name: "test-image.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake image content"),
    })
    await dragPoolItemToGrid(page, "test-image.png", 1, AUDIO_TRACK_ROW)

    await expect(
      page.getByText("Only images/videos on screen rows").first()
    ).toBeVisible()
    await expect(
      page.getByText("Drag media to screen rows, not audio tracks.").first()
    ).toBeVisible()
    await expect(page.getByTestId("cue-test-image.png")).not.toBeVisible()
  })

  test("loop toggle is only shown for audio cues", async ({ page }) => {
    await page.getByText("testi").click()
    await addBlankCue(page, "colorcue", "1", "1")

    const cue = page.getByTestId("cue-colorcue")
    await openCueMenu(cue)

    await expect(
      page.getByRole("button", { name: "Copy colorcue" })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: /Loop audio/ })).toHaveCount(
      0
    )
  })

  test("user can toggle loop for an audio cue", async ({ page }) => {
    await page.getByText("testi").click()

    await uploadAudioFile(page, {
      name: "loop-audio.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from("fake audio content"),
    })
    await dragPoolItemToGrid(page, "loop-audio.mp3", 1, AUDIO_TRACK_ROW)
    await expect(page.getByTestId("cue-loop-audio.mp3")).toBeVisible()

    const cue = page.getByTestId("cue-loop-audio.mp3")
    await openCueMenu(cue)

    const loopButton = page.getByRole("button", {
      name: "Loop audio loop-audio.mp3",
    })
    await expect(loopButton).toBeVisible()
    await expect(loopButton).toHaveAttribute("title", "Enable loop")
    await loopButton.click()

    await expect(page.getByText("Loop enabled").first()).toBeVisible()
    await expect(
      page.getByText("loop-audio.mp3 will loop").first()
    ).toBeVisible()

    await page.reload()
    const cueAfterReload = page.getByTestId("cue-loop-audio.mp3")
    await openCueMenu(cueAfterReload)
    await expect(
      page.getByRole("button", { name: "Loop audio loop-audio.mp3" })
    ).toHaveAttribute("title", "Disable loop")
  })
})
