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

export { loginWith, addPresentation }
