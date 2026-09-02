/**
 * Tests for PresentationPage (src/client/components/presentation/index.jsx),
 * focused on loading and persisting the per-presentation cue transition-type
 * preference via localStorage.
 */

import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import PresentationPage from "../../components/presentation/index"
import { useDispatch, useSelector } from "react-redux"
import { useParams, useNavigate } from "react-router-dom"

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  fetchPresentationInfo: jest.fn(() => ({
    type: "MOCK_FETCH_PRESENTATION_INFO",
  })),
}))

const mockHandleDeletePresentation = jest.fn()
jest.mock("../../components/utils/useDeletePresentation", () => {
  return function useDeletePresentation() {
    return {
      isDialogOpen: false,
      handleDeletePresentation: mockHandleDeletePresentation,
      handleConfirmDelete: jest.fn(),
      handleCancelDelete: jest.fn(),
    }
  }
})

jest.mock("../../components/presentation/EditModeContainer", () => {
  return function MockEditModeContainer(props) {
    return (
      <div>
        <span data-testid="transition-type">{props.transitionType}</span>
        <button
          type="button"
          onClick={() => props.onTransitionChange("slide-left")}
        >
          change-transition
        </button>
        <button type="button" onClick={() => props.onDeletePresentation()}>
          delete-presentation
        </button>
      </div>
    )
  }
})

describe("PresentationPage transition preference", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    useParams.mockReturnValue({ id: "presentation-1" })
    useNavigate.mockReturnValue(jest.fn())
    useDispatch.mockReturnValue(jest.fn())
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          cues: [],
          name: "Test presentation",
          indexCount: 0,
        },
      })
    )
  })

  test("defaults to fade when nothing is stored", () => {
    render(<PresentationPage user={{}} />)

    expect(screen.getByTestId("transition-type").textContent).toBe("fade")
  })

  test("restores a previously saved transition preference from localStorage", () => {
    window.localStorage.setItem(
      "presentation-presentation-1-transition",
      "zoom"
    )

    render(<PresentationPage user={{}} />)

    expect(screen.getByTestId("transition-type").textContent).toBe("zoom")
  })

  test("persists the new transition choice to localStorage when changed", () => {
    render(<PresentationPage user={{}} />)

    fireEvent.click(screen.getByText("change-transition"))

    expect(
      window.localStorage.getItem("presentation-presentation-1-transition")
    ).toBe("slide-left")
    expect(screen.getByTestId("transition-type").textContent).toBe("slide-left")
  })

  test("wires EditModeContainer's onDeletePresentation to handleDeletePresentation(id)", () => {
    render(<PresentationPage user={{}} />)

    fireEvent.click(screen.getByText("delete-presentation"))

    expect(mockHandleDeletePresentation).toHaveBeenCalledWith("presentation-1")
  })
})
