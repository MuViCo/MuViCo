import React from "react"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  waitForElementToBeRemoved,
} from "@testing-library/react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
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

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}))

jest.mock("../../components/utils/firebase", () => ({
  apikey: "testkey",
}))

jest.mock("../../services/presentations", () => ({
  getAll: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  createPresentation: jest.fn((x) => x),
}))

jest.mock("../../components/utils/addInitialElements", () => jest.fn())

jest.mock("../../components/utils/useDeletePresentation")

jest.mock("@chakra-ui/react", () => {
  const React = jest.requireActual("react")
  const originalModule = jest.requireActual("@chakra-ui/react")
  return {
    ...originalModule,
    useDisclosure: () => {
      const [isOpen, setIsOpen] = React.useState(false)
      return {
        isOpen,
        onOpen: () => setIsOpen(true),
        onClose: () => setIsOpen(false),
      }
    },
    useToast: () => {
      const toastFn = jest.fn()
      toastFn.isActive = jest.fn(() => false)
      return toastFn
    },
  }
})

describe("HomePage", () => {
  let navigate = jest.fn()

  beforeEach(() => {
    navigate.mockReset()
    useNavigate.mockClear()
    useNavigate.mockReturnValue(navigate)

    useDispatch.mockReset()
    presentationService.getAll.mockReset()
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
    const mockDispatch = jest.fn(() => ({
      id: "3",
      name: "Presentation 3",
      screenCount: 1,
      startingFrameColor: "#000000",
    }))
    useDispatch.mockReturnValue(mockDispatch)

    render(<HomePage user={{ isAdmin: true }} />)

    fireEvent.click(screen.getByText("New presentation"))

    fireEvent.change(screen.getByTestId("presentation-name"), {
      target: { value: "Presentation 3" },
    })

    fireEvent.click(screen.getByRole("button", { name: /create/i }))

    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith({
        description: "",
        name: "Presentation 3",
        screenCount: 1,
        startingFrameColor: "#000000",
      })
    )

    await waitFor(() =>
      expect(presentationService.getAll).toHaveBeenCalledTimes(1)
    ) //one call in useEffect

    // TODO: add this back
    //expect(addInitialElements).toHaveBeenCalledWith(3, 1, expect.any(Function), "#000000")

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
    const mockDispatch = jest.fn(() => {
      throw new Error(errorMessage)
    })
    useDispatch.mockReturnValue(mockDispatch)

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
      expect(
        screen.getByText(
          "Welcome to the user manual. This modal provides guidance on how to use the application."
        )
      ).toBeInTheDocument()
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

  test("updates input field values on change", () => {
    render(<PresentationForm />)

    const nameInput = screen.getByLabelText("Name*")
    const screenCountInput = screen.getByTestId("presentation-screen-count")

    expect(nameInput.value).toBe("")
    expect(screenCountInput.value).toBe("1")

    fireEvent.change(nameInput, { target: { value: "Test Presentation" } })
    fireEvent.change(screenCountInput, { target: { value: 3 } })

    expect(nameInput.value).toBe("Test Presentation")
    expect(screenCountInput.value).toBe("3")
  })

  test("calls createPresentation function when create button is clicked", () => {
    const createPresentationMock = jest.fn()
    render(
      <PresentationForm
        createPresentationHandler={createPresentationMock}
        onCancel={() => {}}
      />
    )

    const nameInput = screen.getByLabelText("Name*")
    const screenCountInput = screen.getByTestId("presentation-screen-count")
    fireEvent.change(nameInput, { target: { value: "Test Presentation" } })
    fireEvent.change(screenCountInput, { target: { value: 1 } })
    fireEvent.click(screen.getByText("create"))

    expect(createPresentationMock).toHaveBeenCalledWith({
      description: "",
      name: "Test Presentation",
      screenCount: 1,
      startingFrameColor: "#000000",
    })
  })

  test("calls onCancel function when cancel button is clicked", () => {
    const onCancelMock = jest.fn()
    render(
      <PresentationForm
        createPresentationHandler={() => {}}
        onCancel={onCancelMock}
      />
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

  test("renders the component with presentation buttons and toggle", () => {
    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
      />
    )
    expect(screen.getByText("Test Presentation")).toBeInTheDocument()
    expect(screen.getByText("Another Presentation")).toBeInTheDocument()

    // toggle buttons exist, grid is active by default
    const gridBtn = screen.getByTestId("grid-button")
    const listBtn = screen.getByTestId("list-button")
    expect(gridBtn).toBeInTheDocument()
    expect(listBtn).toBeInTheDocument()
  })

  test("switches to list view when list button is clicked", () => {
    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
      />
    )
    const listBtn = screen.getByTestId("list-button")
    fireEvent.click(listBtn)
    // list items should be rendered
    const items = screen.getAllByRole("listitem")
    expect(items.length).toBe(mock_data.length)
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

  test("calls handleDeletePresentation when delete button is clicked", () => {
    const handleDeletePresentationMock = jest.fn()
    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
        handleDeletePresentation={handleDeletePresentationMock}
      />
    )

    const deleteButtons = screen.getAllByLabelText("Delete presentation")
    fireEvent.click(deleteButtons[0])
    expect(handleDeletePresentationMock).toHaveBeenCalledWith("123")
  })

  test("prevents event propagation when delete button is clicked", () => {
    const handlePresentationClickMock = jest.fn()
    const handleDeletePresentationMock = jest.fn()

    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={handlePresentationClickMock}
        handleDeletePresentation={handleDeletePresentationMock}
      />
    )

    fireEvent.click(screen.getAllByLabelText("Delete presentation")[0])

    expect(handleDeletePresentationMock).toHaveBeenCalledWith("123")
    expect(handlePresentationClickMock).not.toHaveBeenCalled()
  })

  test("initializes viewMode from localStorage", () => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(() => "list"),
      setItem: jest.fn(),
    }
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    })

    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
      />
    )

    // Should initialize to "list" from localStorage
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
      "presentationsLayoutMode"
    )

    // List view should be active (list button should have different styling or check the rendered view)
    const listBtn = screen.getByTestId("list-button")
    expect(listBtn).toBeInTheDocument()
    // Since we switched to list, list items should be rendered
    const items = screen.getAllByRole("listitem")
    expect(items.length).toBe(mock_data.length)
  })

  test("saves viewMode to localStorage when changed", () => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(() => "grid"), // default
      setItem: jest.fn(),
    }
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    })

    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
      />
    )

    // Initially called once on mount with "grid"
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "presentationsLayoutMode",
      "grid"
    )

    // Click list button
    const listBtn = screen.getByTestId("list-button")
    fireEvent.click(listBtn)

    // Should save "list" to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "presentationsLayoutMode",
      "list"
    )
  })

  test("defaults to grid view when localStorage is empty", () => {
    // Mock localStorage with no stored value
    const mockLocalStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    }
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    })

    render(
      <PresentationsGrid
        presentations={mock_data}
        handlePresentationClick={() => {}}
      />
    )

    // Should default to grid (check that grid view is rendered, not list)
    const gridBtn = screen.getByTestId("grid-button")
    expect(gridBtn).toBeInTheDocument()
    // Grid view should be active by default, so no list items
    expect(screen.queryByRole("listitem")).toBeNull()
  })

  test("opens modal from edit action with prefilled name and description", async () => {
    const dataWithDescription = [
      {
        id: "123",
        name: "Test Presentation",
        description: "Existing description",
      },
    ]

    render(
      <PresentationsGrid
        presentations={dataWithDescription}
        handlePresentationClick={() => {}}
        handleDeletePresentation={() => {}}
        handleEditPresentation={jest.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText("Edit presentation"))

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    const dialog = screen.getByRole("dialog")
    const [titleInput, descriptionInput] =
      within(dialog).getAllByRole("textbox")

    expect(titleInput).toHaveValue("Test Presentation")
    expect(descriptionInput).toHaveValue("Existing description")
  })

  test("disables save when title is empty", async () => {
    const dataWithDescription = [
      {
        id: "123",
        name: "Test Presentation",
        description: "Existing description",
      },
    ]

    render(
      <PresentationsGrid
        presentations={dataWithDescription}
        handlePresentationClick={() => {}}
        handleDeletePresentation={() => {}}
        handleEditPresentation={jest.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText("Edit presentation"))

    const dialog = await screen.findByRole("dialog")
    const [titleInput] = within(dialog).getAllByRole("textbox")
    fireEvent.change(titleInput, { target: { value: "   " } })

    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled()
  })

  test("save calls handler with trimmed title and description", async () => {
    const handleEditPresentationMock = jest.fn().mockResolvedValue({})
    const dataWithDescription = [
      {
        id: "123",
        name: "Test Presentation",
        description: "Existing description",
      },
    ]

    render(
      <PresentationsGrid
        presentations={dataWithDescription}
        handlePresentationClick={() => {}}
        handleDeletePresentation={() => {}}
        handleEditPresentation={handleEditPresentationMock}
      />
    )

    fireEvent.click(screen.getByLabelText("Edit presentation"))

    const dialog = await screen.findByRole("dialog")
    const [titleInput, descriptionInput] =
      within(dialog).getAllByRole("textbox")

    fireEvent.change(titleInput, { target: { value: "  Updated Title  " } })
    fireEvent.change(descriptionInput, {
      target: { value: "Updated description" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(handleEditPresentationMock).toHaveBeenCalledWith("123", {
        name: "Updated Title",
        description: "Updated description",
      })
    })
  })

  test("successful save closes modal", async () => {
    const handleEditPresentationMock = jest.fn().mockResolvedValue({})
    const dataWithDescription = [
      {
        id: "123",
        name: "Test Presentation",
        description: "Existing description",
      },
    ]

    render(
      <PresentationsGrid
        presentations={dataWithDescription}
        handlePresentationClick={() => {}}
        handleDeletePresentation={() => {}}
        handleEditPresentation={handleEditPresentationMock}
      />
    )

    fireEvent.click(screen.getByLabelText("Edit presentation"))
    const dialog = await screen.findByRole("dialog")

    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"))
  })

  test("failed save keeps modal open and shows failure state", async () => {
    const handleEditPresentationMock = jest
      .fn()
      .mockRejectedValue(new Error("Save failed"))
    const dataWithDescription = [
      {
        id: "123",
        name: "Test Presentation",
        description: "Existing description",
      },
    ]

    render(
      <PresentationsGrid
        presentations={dataWithDescription}
        handlePresentationClick={() => {}}
        handleDeletePresentation={() => {}}
        handleEditPresentation={handleEditPresentationMock}
      />
    )

    fireEvent.click(screen.getByLabelText("Edit presentation"))
    const dialog = await screen.findByRole("dialog")

    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(handleEditPresentationMock).toHaveBeenCalledTimes(1)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(
        screen.getByText("Failed to save presentation. Please try again.")
      ).toBeInTheDocument()
    })
  })
})
