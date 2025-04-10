import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useNavigate } from "react-router-dom"
import "@testing-library/jest-dom"

import HomePage from "../../components/homepage/index"
import PresentationsGrid from "../../components/homepage/PresentationsGrid"
import AdminControls from "../../components/homepage/AdminControls"
import PresentationFormWrapper from "../../components/homepage/PresentationFormWrapper"
import PresentationForm from "../../components/homepage/PresentationForm"
import presentationService from "../../services/presentations"
import addInitialElements from "../../components/utils/addInitialElements"

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}))
jest.mock("../../components/utils/firebase", () => ({
  apikey: "testkey",
}))

jest.mock("../../services/presentations", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
}))

jest.mock("../../components/utils/addInitialElements", () => jest.fn())

jest.mock("../../components/utils/useDeletePresentation", () => ({
  __esModule: true,
  default: () => ({
    isDialogOpen: false,
    handleDeletePresentation: jest.fn(),
    handleConfirmDelete: jest.fn(),
    handleCancelDelete: jest.fn(),
    presentationToDelete: null,
  }),
}))

describe("HomePage", () => {
  beforeEach(() => {
    useNavigate.mockClear()
    presentationService.create.mockClear()
    presentationService.getAll.mockClear()
    addInitialElements.mockClear()
  })

  test('navigates to /users when "All users" button is clicked', async () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)
    render(<HomePage user={{ isAdmin: true }} />)
    fireEvent.click(screen.getByText("All users"))
    expect(navigate).toHaveBeenCalledWith("/users")
  })

  test("creates a presentation and navigates to the new presentation", async () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)

    const mockPresentations = [
      { id: 1, name: "Presentation 1" },
      { id: 2, name: "Presentation 2" },
      { id: 3, name: "Presentation 3" },
    ]
    presentationService.getAll.mockResolvedValue(mockPresentations)
    presentationService.create.mockResolvedValue({
      id: 3,
      name: "Presentation 3",
    })

    render(<HomePage user={{ isAdmin: true }} />)

    fireEvent.click(screen.getByText("New presentation"))

    fireEvent.change(screen.getByTestId("presentation-name"), {
      target: { value: "Presentation 3" },
    })

    fireEvent.click(screen.getByRole("button", { name: /create/i }))

    await waitFor(() =>
      expect(presentationService.create).toHaveBeenCalledWith({
        name: "Presentation 3",
      })
    )

    await waitFor(() =>
      expect(presentationService.getAll).toHaveBeenCalledTimes(2)
    ) //one call in useEffect and one call in createPresentation

    expect(addInitialElements).toHaveBeenCalledWith(3, expect.any(Function))

    expect(navigate).toHaveBeenCalledWith("/presentation/3")
  })
})

describe("PresentationForm", () => {
  test("Renders the 'New presentation'-button", () => {
    render(
      <PresentationFormWrapper
        createPresentation={() => {}}
        togglableRef={() => {}}
        handleCancel={() => {}}
      />
    )
    expect(screen.getByText("New presentation")).toBeInTheDocument()
  })
  test("renders the form with name input field and buttons", () => {
    render(<PresentationForm />)

    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByTestId("presentation-name")).toBeInTheDocument()
    expect(screen.getByLabelText("Name*")).toBeInTheDocument()
  })

  test("calls createPresentation function when create button is clicked", () => {
    const createPresentationMock = jest.fn()
    render(
      <PresentationForm
        createPresentation={createPresentationMock}
        onCancel={() => {}}
      />
    )

    const nameInput = screen.getByLabelText("Name*")
    fireEvent.change(nameInput, { target: { value: "Test Presentation" } })
    fireEvent.click(screen.getByText("create"))

    expect(createPresentationMock).toHaveBeenCalledWith({
      name: "Test Presentation",
    })
  })

  test("calls onCancel function when cancel button is clicked", () => {
    const onCancelMock = jest.fn()
    render(
      <PresentationForm createPresentation={() => {}} onCancel={onCancelMock} />
    )

    fireEvent.click(screen.getByText("cancel"))

    expect(onCancelMock).toHaveBeenCalled()
  })
})

describe("AdminControls", () => {
  test("Renders the AdminControls component", () => {
    render(<AdminControls isAdmin={true} />)
    expect(screen.getByText("Admin controls")).toBeInTheDocument()
  })

  test("renders the component with buttons", () => {
    render(<AdminControls isAdmin={true} />)
    expect(screen.getByText("All users")).toBeInTheDocument()
  })
  test("navigates to /users when 'All users' button is clicked", () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)
    render(<AdminControls isAdmin={true} navigate={navigate} />)
    fireEvent.click(screen.getByText("All users"))
    expect(navigate).toHaveBeenCalledWith("/users")
  })
})

const mock_data = [
  {
    id: "123",
    name: "Test Presentation",
  },
  {
    id: "456",
    name: "Another Presentation",
  },
]

describe("PresentationsGrid", () => {
  test("Renders the PresentationsGrid component", () => {
    render(
      <PresentationsGrid
        presentations={[]}
        handlePresentationClick={() => {}}
      />
    )
    expect(screen.getByText("Presentations")).toBeInTheDocument()
  })
  test("renders the component with presentation buttons", () => {
    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
      />
    )
    expect(screen.getByText("Test Presentation")).toBeInTheDocument()
    expect(screen.getByText("Another Presentation")).toBeInTheDocument()
  })
  test("calls handlePresentationClick with correct id when presentation button is clicked", () => {
    const handlePresentationClickMock = jest.fn()
    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={handlePresentationClickMock}
      />
    )
    fireEvent.click(screen.getByText("Test Presentation"))
    expect(handlePresentationClickMock).toHaveBeenCalledWith("123")
  })
})
