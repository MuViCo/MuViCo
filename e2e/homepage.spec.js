import { loginWith, addPresentation } from "./helper"

const { test, describe, expect, beforeEach } = require("@playwright/test")

describe("Homepage", () => {
  beforeEach(async ({ page, request }) => {
    await request.post("http:localhost:8000/api/testing/reset")
    await request.post("http:localhost:8000/api/signup", {
      data: {
        username: "testuser",
        password: "test",
      },
    })
    await page.goto("http://localhost:3000/")
    await loginWith(page, "testuser", "test")
    await addPresentation(page, "testi")
    await page.goto("http://localhost:3000/home")
  })

  test("user can add a presentation", async ({ page }) => {
    await addPresentation(page, "testpresentation")
    await expect(page.getByRole("button", { name: "Show mode" })).toBeVisible()
  })

  test("user can enter a presentation", async ({ page }) => {
    const heading = page.getByText("testi")
    const card = heading.locator("..").locator("..")
    await expect(card).toBeVisible()
    await card.click()

    await expect(page.getByRole("button", { name: "Show mode" })).toBeVisible()
  })

  test("user can delete a presentation", async ({ page }) => {
    const heading = page.getByText("testi");
    const card = heading.locator("..").locator("..");
    await expect(card).toBeVisible();
    await card.click();
    await page.click('button[name="delete-presentation"]');
    await expect(card).not.toBeVisible();
  });

  test("user can edit a presentation", async ({ page }) => {
    const heading = page.getByText("testi");
    const card = heading.locator("..").locator("..");
    await expect(card).toBeVisible();
    await card.hover();
    await page.click('button[name="edit-presentation"]');
    await page.fill('input[name="presentation-name"]', "editedpresentation");
    await page.click('button[type="submit"]');
    await expect(page.getByText("editedpresentation")).toBeVisible();
  });



  
  
})
