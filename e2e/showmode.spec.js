import { addPresentation, disableTutorials, loginWith } from "./helper"
const { test, expect } = require("@playwright/test")

const testuser = "showmodetestuser"
const testPw = "test12345"

test.beforeEach(async ({ page, request }) => {
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
})

test("user can run a presentation from show mode", async ({
  page,
  context,
}) => {
  await addPresentation(page, "show-mode-test")
  await page.getByRole("button", { name: "Show mode" }).click()

  await expect(page).toHaveURL(/\/presentation\/[^/]+\/show$/)
  await expect(page.getByText("SHOW", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: /Control room/ }).click()
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Open display 1" }).click(),
  ])

  await page.getByRole("button", { name: "GO", exact: true }).click()
  await expect(page.getByText("Frame 2 will change")).toBeVisible()

  await page.getByRole("button", { name: "Blackout" }).click()
  await expect(page.getByRole("button", { name: "Blackout on" })).toBeVisible()
  await expect(popup.getByTestId("screen-blackout")).toBeVisible()

  await page.getByRole("button", { name: "Exit" }).click()
  await expect(page).toHaveURL(/\/presentation\/[^/]+$/)
  await expect(page.getByRole("button", { name: "Show mode" })).toBeVisible()
})
