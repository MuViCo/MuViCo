import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useNavigate } from "react-router-dom"
import "@testing-library/jest-dom"

import HomePage from "../../components/homepage/index"
import UserManualModal from "../../components/navbar/UserManualModal"
import PresentationsGrid from "../../components/homepage/PresentationsGrid"
import AdminControls from "../../components/homepage/AdminControls"
import PresentationFormWrapper from "../../components/homepage/PresentationFormWrapper"
import PresentationForm from "../../components/homepage/PresentationForm"
import presentationService from "../../services/presentations"
import addInitialElements from "../../components/utils/addInitialElements"
import useDeletePresentation from "../../components/utils/useDeletePresentation"

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

jest.mock("../../components/utils/useDeletePresentation")

jest.mock("@chakra-ui/react", () => {
  const originalModule = jest.requireActual("@chakra-ui/react")
  return {
    ...originalModule,
    useDisclosure: () => ({
      isOpen: false,
      onOpen: jest.fn(),
      onClose: jest.fn(),
    }),
  }
})

describe("HomePage", () => {
  let navigate = jest.fn()

  beforeEach(() => {
    navigate.mockClear()
    navigate = jest.fn()
    useNavigate.mockClear()
    useNavigate.mockReturnValue(navigate)

    presentationService.create.mockClear()
    presentationService.getAll.mockClear()
    addInitialElements.mockClear()
    useDeletePresentation.mockClear()

    const mockPresentations = [
      { id: 1, name: "Presentation 1" },
      { id: 2, name: "Presentation 2" },
      { id: 3, name: "Presentation 3" },
    ]
    presentationService.getAll.mockResolvedValue(mockPresentations)

    useDeletePresentation.mockImplementation(() => ({
      isDialogOpen: false,
      handleDeletePresentation: jest.fn(),
      handleConfirmDelete: jest.fn(),
      handleCancelDelete: jest.fn(),
      presentationToDelete: null,
    }))
  })

  test("navigates to /users when All users -button is clicked", async () => {
    render(<HomePage user={{ isAdmin: true }} />)
    fireEvent.click(screen.getByText("All users"))
    expect(navigate).toHaveBeenCalledWith("/users")
  })

  test("creates a presentation and navigates to the new presentation", async () => {
    presentationService.create.mockResolvedValue({
      id: 3,
      name: "Presentation 3",
      screenCount: 1
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
        screenCount: 1
      })
    )

    await waitFor(() =>
      expect(presentationService.getAll).toHaveBeenCalledTimes(2)
    ) //one call in useEffect and one call in createPresentation

    expect(addInitialElements).toHaveBeenCalledWith(3, 1, expect.any(Function))

    expect(navigate).toHaveBeenCalledWith("/presentation/3")
  })

  test("calls toggleVisibility when handleCancel is invoked", async () => {
    const toggleVisibilityMock = jest.fn()
    const fakeRef = { current: { toggleVisibility: toggleVisibilityMock } }
    const useRefSpy = jest.spyOn(React, "useRef").mockReturnValue(fakeRef)

    render(<HomePage user={{ isAdmin: true }} />)

    fireEvent.click(screen.getByText("New presentation"))
    const cancelButton = screen.getByRole("button", { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(toggleVisibilityMock).toHaveBeenCalled()

    useRefSpy.mockRestore()
  })

  test("navigates to / on 401 Unauthorized error", async () => {
    presentationService.getAll.mockRejectedValue({
      response: { status: 401 },
    })

    render(<HomePage user={{ isAdmin: true }} />)

    await waitFor(() => expect(presentationService.getAll).toHaveBeenCalled())

    expect(navigate).toHaveBeenCalledWith("/")
  })

  test("does not navigate to / on non-401 error", async () => {
    presentationService.getAll.mockRejectedValue(new Error("Random error"))

    render(<HomePage user={{ isAdmin: true }} />)

    await waitFor(() => expect(presentationService.getAll).toHaveBeenCalled())

    expect(navigate).not.toHaveBeenCalledWith("/")
  })

  test("handles error when presentationService.create fails", async () => {
    const errorMessage = "Creation failed"
    presentationService.create.mockRejectedValue(new Error(errorMessage))

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})

    render(<HomePage user={{ isAdmin: true }} />)

    fireEvent.click(screen.getByText("New presentation"))
    fireEvent.change(screen.getByTestId("presentation-name"), {
      target: { value: "Faulty Presentation" },
    })

    fireEvent.click(screen.getByRole("button", { name: /create/i }))

    await waitFor(() => {
      expect(navigate).not.toHaveBeenCalled()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating presentation: ",
        expect.any(Error)
      )
    })
    consoleErrorSpy.mockRestore()
  })

  test("navigates to /presentation/presentationId on presentation click", async () => {
    render(<HomePage user={{ isAdmin: true }} />)

    const presentationElement = await waitFor(() =>
      screen.getByText("Presentation 3")
    )

    fireEvent.click(presentationElement)

    expect(navigate).toHaveBeenCalledWith("/presentation/3")
  })

  test("calls handleConfirmDelete and filters presentations on presentation deletion", async () => {
    const handleConfirmDeleteMock = jest.fn()

    useDeletePresentation.mockImplementation(() => ({
      isDialogOpen: true,
      handleDeletePresentation: jest.fn(),
      handleConfirmDelete: handleConfirmDeleteMock,
      handleCancelDelete: jest.fn(),
      presentationToDelete: 2,
    }))

    render(<HomePage user={{ isAdmin: true }} />)

    await waitFor(() => {
      expect(screen.getByText("Presentation 2")).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to delete/i)
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Yes"))

    await waitFor(() => {
      expect(handleConfirmDeleteMock).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.queryByText("Presentation 2")).not.toBeInTheDocument()
    })
  })

  test("handleDialogConfirm catches error on failed deletion", async () => {
    const errorMessage = "Deletion failed"
    const handleConfirmDeleteMock = jest.fn()
    handleConfirmDeleteMock.mockRejectedValue(new Error(errorMessage))

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})

    useDeletePresentation.mockImplementation(() => ({
      isDialogOpen: true,
      handleDeletePresentation: jest.fn(),
      handleConfirmDelete: handleConfirmDeleteMock,
      handleCancelDelete: jest.fn(),
      presentationToDelete: 2,
    }))

    render(<HomePage user={{ isAdmin: true }} />)

    await waitFor(() => {
      expect(
        screen.getByText(/are you sure you want to delete/i)
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Yes"))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting presentation: ",
        expect.any(Error)
      )
    })
    consoleErrorSpy.mockRestore()
  })

  test("shows user manual when clicking info button", async () => {
    render(
      <UserManualModal 
        isOpen={true} 
        onClose={() => {}} 
        isHomepage={true}
        isPresentationPage={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("Welcome to the user manual. This modal provides guidance on how to use the application.")).toBeInTheDocument()
    })
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
    const screenCountInput = screen.getByTestId("presentation-screen-count")
    fireEvent.change(nameInput, { target: { value: "Test Presentation" } })
    fireEvent.change(screenCountInput, { target: { value: 1 } })
    fireEvent.click(screen.getByText("create"))

    expect(createPresentationMock).toHaveBeenCalledWith({
      name: "Test Presentation",
      screenCount: 1
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
