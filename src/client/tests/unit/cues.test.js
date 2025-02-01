import CuesForm from "../../components/presentation/Cues"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import { MemoryRouter } from "react-router-dom"

describe("cues", () => {
  test("render content", () => {
    render(
      <MemoryRouter>
        <CuesForm />
      </MemoryRouter>
    )
    expect(screen.getByText("Screen 1-4*")).toBeDefined()
    expect(screen.getByText("Index 1-100")).toBeDefined()
    expect(screen.getByText("Name*")).toBeDefined()
  })

  test("add cues", async () => {
    const addCue = jest.fn()
    const { getByLabelText, getByText, getByRole } = render(
      <MemoryRouter>
        <CuesForm addCue={addCue} />
      </MemoryRouter>
    )

    const indexInput = screen.getByRole("textbox")
    fireEvent.change(indexInput, {
      target: { value: "testuser" },
    })
    expect(indexInput).toHaveValue("testuser")
    expect(screen.getByText("Submit")).toBeDefined()
  })
})
