import React from "react"
import { render, screen } from "@testing-library/react"
import { PresentationPage } from "../../components/presentation/index"
import "@testing-library/jest-dom"
import { waitFor } from "@testing-library/react"

describe("PresentationPage", () => {
  test("renders content", async () => {
    const userId = "1234"
    const presentation = {
      name: "Sample Presentation",
      files: [],
      user: "5678",
    }
    render(<PresentationPage userId={userId} />)

    // Wait for the presentation to be fetched and the component to render
    await waitFor(() => {
      expect(
        screen.getByText("Nice try, you don't have access to this page! :(")
      ).toBeDefined()
    })

    render(<PresentationPage userId={"5678"} />)

    // Wait for the presentation to be fetched and the component to render
    await waitFor(() => {
      expect(screen.getByText("Sample Presentation")).toBeDefined()
    })
  })
})
