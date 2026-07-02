const loginWith = async (page, username, password) => {
  await page.getByRole("button", { name: "Login" }).click()
  await page.getByTestId("username_login").fill(username)
  await page.getByTestId("password_login").fill(password)
  await page.getByTestId("login_inform").click()
  await page.waitForURL("http://localhost:3000/home")
}

const disableTutorials = async (page) => {
  await page.evaluate(() => {
    localStorage.setItem("hasSeenHelp_homepage", "true")
    localStorage.setItem("hasSeenHelp_presentation", "true")
  })
}

const addPresentation = async (
  page,
  name,
  screenCount = 2,
  startingFrameColor = "black",
  description = "test presentation"
) => {
  await page.getByRole("button", { name: "New presentation" }).click()
  await page.getByTestId("presentation-name").fill(name)
  await page.getByTestId("presentation-description").fill(description)
  const screenInput = page.getByTestId("presentation-screen-count")
  await screenInput.fill("")
  await screenInput.type(screenCount.toString())

  await page.getByRole("button", { name: "create" }).click()

  await page.waitForURL(/\/presentation\//)
}

const addBlankCue = async (page, name, index, screen) => {
  const gridContainer = page.locator('[data-testid="edit-mode-grid-container"]')
  const dropArea = page.locator('[data-testid="drop-area"]')

  const containerBox = await gridContainer.boundingBox()
  if (!containerBox) throw new Error("Grid container bounding box not found")

  const clientX = containerBox.x + Number(index) * 160 + 80
  const clientY = containerBox.y + Number(screen) * 110 + 10

  const dragData = {
    type: "newCueFromForm",
    cueName: name,
    color: "#9244ff",
    elementType: "color",
  }

  const dataTransfer = await page.evaluateHandle((data) => {
    const dt = new DataTransfer()
    dt.setData("application/json", JSON.stringify(data))
    dt.setData("text/plain", JSON.stringify(data))
    return dt
  }, dragData)

  await dropArea.dispatchEvent("dragenter", { clientX, clientY, dataTransfer })
  await dropArea.dispatchEvent("dragover", { clientX, clientY, dataTransfer })
  await dropArea.dispatchEvent("drop", { clientX, clientY, dataTransfer })
}

const uploadMediaFile = async (page, files) => {
  await page.getByRole("button", { name: "Media" }).click()
  await page.locator("#media-upload").setInputFiles(files)
}

const uploadAudioFile = async (page, files) => {
  await page.getByRole("button", { name: "Audio", exact: true }).click()
  await page.locator("#sound-upload").setInputFiles(files)
}

const dragToGrid = async (page, source, index, screen) => {
  const dropArea = page.locator('[data-testid="drop-area"]')
  const gridContainer = page.locator('[data-testid="edit-mode-grid-container"]')

  const sourceBox = await source.boundingBox()
  if (!sourceBox) throw new Error("Drag source bounding box not found")
  const containerBox = await gridContainer.boundingBox()
  if (!containerBox) throw new Error("Grid container bounding box not found")

  const clientX = containerBox.x + Number(index) * 160 + 80
  const clientY = containerBox.y + Number(screen) * 110 + 10

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
  await source.dispatchEvent("dragstart", {
    dataTransfer,
    clientX: sourceBox.x,
    clientY: sourceBox.y,
  })
  await dropArea.dispatchEvent("dragenter", { clientX, clientY, dataTransfer })
  await dropArea.dispatchEvent("dragover", { clientX, clientY, dataTransfer })
  await dropArea.dispatchEvent("drop", { clientX, clientY, dataTransfer })
}

const dragPoolItemToGrid = async (page, fileName, index, screen) => {
  const source = page
    .locator('div[draggable="true"]')
    .filter({ hasText: fileName })
    .first()
  await dragToGrid(page, source, index, screen)
}

const openCueMenu = async (cue) => {
  await cue.hover()
  await cue.getByRole("button", { name: "Options" }).click()
}

export {
  loginWith,
  disableTutorials,
  addPresentation,
  addBlankCue,
  uploadMediaFile,
  uploadAudioFile,
  dragToGrid,
  dragPoolItemToGrid,
  openCueMenu,
}
