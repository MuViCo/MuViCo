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

/**
 * Centre of a timeline slot, read from the DOM rather than recomputed here.
 *
 * The empty-cell backdrop is laid out from the same geometry as the drop
 * hit-test, so asking it where a slot is keeps these tests correct across
 * changes to the row height, the column width or the gaps.
 */
const gridCellPoint = async (page, row, column) => {
  const cell = page.getByTestId(`grid-empty-cell-${row}-${column}`)
  const box = await cell.boundingBox()
  if (!box) throw new Error(`Grid cell ${row}-${column} not found`)
  return { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 }
}

/**
 * The add/remove screen controls only appear while their screen's lane group is
 * hovered, so every test that clicks one has to hover the group first.
 */
const revealScreenControls = async (page, screen) => {
  const group = page.getByTestId(`lane-group-screen-${screen}`)
  await group.hover()
  return group
}

const addBlankCue = async (page, name, index, screen) => {
  const dropArea = page.locator('[data-testid="drop-area"]')

  const { clientX, clientY } = await gridCellPoint(
    page,
    Number(screen) - 1,
    Number(index)
  )

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

// One pool and one input for every kind. uploadAudioFile keeps its own name
// so the audio specs still read as being about audio.
const uploadMediaFile = async (page, files) => {
  await page.getByRole("tab", { name: "Media", exact: true }).click()
  await page.locator("#media-upload").setInputFiles(files)
}

const uploadAudioFile = uploadMediaFile

const dragToGrid = async (page, source, index, screen) => {
  const dropArea = page.locator('[data-testid="drop-area"]')

  const sourceBox = await source.boundingBox()
  if (!sourceBox) throw new Error("Drag source bounding box not found")

  const { clientX, clientY } = await gridCellPoint(
    page,
    Number(screen) - 1,
    Number(index)
  )

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
  gridCellPoint,
  revealScreenControls,
  addBlankCue,
  uploadMediaFile,
  uploadAudioFile,
  dragToGrid,
  dragPoolItemToGrid,
  openCueMenu,
}
