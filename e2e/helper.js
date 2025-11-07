const loginWith = async (page, username, password) => {
  await page.getByRole("button", { name: "Login" }).click()
  await page.getByTestId("username_login").fill(username)
  await page.getByTestId("password_login").fill(password)
  await page.getByTestId("login_inform").click()
}

const addPresentation = async (page, name, screenCount = 2, startingFrameColor = "black") => {
  await page.getByRole("button", { name: "New presentation" }).click()
  await page.getByTestId("presentation-name").fill(name)
  const screenInput = page.getByTestId("presentation-screen-count")
  await screenInput.fill("")
  await screenInput.type(screenCount.toString())
  await page.getByTestId("starting-frame-color").selectOption(startingFrameColor)

  await page.getByRole("button", { name: "create" }).click()
}

const addBlankCue = async (page, name, index, screen) => {
  await page.getByRole("button", { name: "Add element" }).click()
  await page.getByTestId("screen-number").fill("") 
  await page.getByTestId("screen-number").type(screen.toString())

  await page.getByTestId("index-number").fill("")
  await page.getByTestId("index-number").type(index.toString())

  await page.getByTestId("cue-name").fill(name)

  await page.getByTestId("add-blank").selectOption("/blank.png")

  await page.getByRole("button", { name: "Submit" }).click()
}

export { loginWith, addPresentation, addBlankCue }
