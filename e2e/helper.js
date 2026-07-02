const loginWith = async (page, username, password) => {
  await page.getByRole("button", { name: "Login" }).click()
  await page.getByTestId("username_login").fill(username)
  await page.getByTestId("password_login").fill(password)
  await page.getByTestId("login_inform").click()
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

export { loginWith, disableTutorials, addPresentation, addBlankCue }
