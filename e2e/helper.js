const loginWith = async (page, username, password) => {
  await page.getByRole("button", { name: "Login" }).click()
  await page.getByTestId("username_login").fill(username)
  await page.getByTestId("password_login").fill(password)
  await page.getByTestId("login_inform").click()
}

const addPresentation = async (page, name) => {
  await page.getByRole("button", { name: "New presentation" }).click()
  await page.getByTestId("presentation-name").fill(name)
  await page.getByRole("button", { name: "create" }).click()
}

const addBlankCue = async (page, name, index, screen) => {
  await page.getByRole("button", { name: "Add Cue" }).click()
  await page.getByTestId("index-number").fill(index)
  await page.getByTestId("cue-name").fill(name)
  await page.getByTestId("screen-number").fill(screen)
  await page.getByRole("button", { name: "Submit" }).click()
  await page.getByRole("button", { name: "Close" }).click()
}

export { loginWith, addPresentation, addBlankCue }
