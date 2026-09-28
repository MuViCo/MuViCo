/**
 * Tests for PresentationPage (src/client/components/presentation/index.jsx),
 * focused on loading and persisting the per-presentation cue transition-type
 * preference via localStorage.
 */

import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import PresentationPage from "../../components/presentation/index"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useParams, useNavigate } from "react-router-dom"
import {
  fetchPresentationInfo,
  fetchSharedPresentationInfo,
} from "../../redux/presentationReducer"

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  fetchPresentationInfo: jest.fn(() => ({
    type: "MOCK_FETCH_PRESENTATION_INFO",
  })),
  fetchSharedPresentationInfo: jest.fn(() => ({
    type: "MOCK_FETCH_SHARED_PRESENTATION_INFO",
  })),
}))

jest.mock("../../components/utils/useDeletePresentation", () => {
  return function useDeletePresentation() {
    return {
      isDialogOpen: false,
      handleDeletePresentation: jest.fn(),
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
        <span data-testid="show-mode-route">{String(props.isShowMode)}</span>
        <span data-testid="shared-token">{String(props.sharedToken)}</span>
        <button
          type="button"
          onClick={() => props.onTransitionChange("slide-left")}
        >
          change-transition
        </button>
        <button type="button" onClick={props.onEnterShow}>
          enter-show
        </button>
        <button type="button" onClick={props.onExitShow}>
          exit-show
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
    useLocation.mockReturnValue({ pathname: "/presentation/presentation-1" })
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

  test("passes show mode state from the route", () => {
    useLocation.mockReturnValue({
      pathname: "/presentation/presentation-1/show",
    })

    render(<PresentationPage user={{}} />)

    expect(screen.getByTestId("show-mode-route")).toHaveTextContent("true")
  })

  test("navigates between edit and show routes", () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)

    render(<PresentationPage user={{}} />)

    fireEvent.click(screen.getByText("enter-show"))
    fireEvent.click(screen.getByText("exit-show"))

    expect(navigate).toHaveBeenNthCalledWith(
      1,
      "/presentation/presentation-1/show"
    )
    expect(navigate).toHaveBeenNthCalledWith(2, "/presentation/presentation-1")
  })
})

describe("PresentationPage through a share link", () => {
  const renderShared = ({ rejects, pathname = "/shared/tok-abc" } = {}) => {
    const navigate = jest.fn()
    const dispatch = jest.fn(() =>
      rejects ? Promise.reject(new Error(rejects)) : Promise.resolve()
    )
    useParams.mockReturnValue({ token: "tok-abc" })
    useNavigate.mockReturnValue(navigate)
    useLocation.mockReturnValue({ pathname })
    useDispatch.mockReturnValue(dispatch)
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: { cues: [], name: "Shared show", indexCount: 0 },
      })
    )
    render(<PresentationPage user={{}} shared />)
    return { navigate, dispatch }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
  })

  test("loads the presentation by its token, never by id", () => {
    const { dispatch } = renderShared()

    expect(fetchSharedPresentationInfo).toHaveBeenCalledWith("tok-abc")
    expect(fetchPresentationInfo).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  test("opens the read-only editor, not Show mode, on the link itself", () => {
    renderShared()

    expect(screen.getByTestId("show-mode-route")).toHaveTextContent("false")
    expect(screen.getByTestId("shared-token")).toHaveTextContent("tok-abc")
  })

  test("opens Show mode on the link's /show page", () => {
    renderShared({ pathname: "/shared/tok-abc/show" })

    expect(screen.getByTestId("show-mode-route")).toHaveTextContent("true")
  })

  test("Show mode stays inside the share link", () => {
    const { navigate } = renderShared()

    fireEvent.click(screen.getByText("enter-show"))
    fireEvent.click(screen.getByText("exit-show"))

    expect(navigate).toHaveBeenNthCalledWith(1, "/shared/tok-abc/show")
    expect(navigate).toHaveBeenNthCalledWith(2, "/shared/tok-abc")
  })

  test("sends the viewer home when the link no longer works", async () => {
    const { navigate } = renderShared({
      rejects: "shared presentation not found",
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/home"))
  })
})
