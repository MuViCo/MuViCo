import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { useNavigate, Router } from "react-router-dom"
import HomePage from "../../components/homepage/index"
import PresentationForm from "../../components/homepage/presentationform"
import "@testing-library/jest-dom"

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}))

describe("HomePage", () => {
  beforeEach(() => {
    useNavigate.mockClear()
  })

  test("renders the component", () => {
    render(
      <Router>
        <HomePage user={{ isAdmin: true }} />
      </Router>
    )
    expect(screen.getByText("Admin controls")).toBeInTheDocument()
    expect(screen.getByText("Presentations")).toBeInTheDocument()
  })

  test('navigates to /users when "All users" button is clicked', () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)
    render(<HomePage user={{ isAdmin: true }} />)
    fireEvent.click(screen.getByText("All users"))
    expect(navigate).toHaveBeenCalledWith("/users")
  })

  test('navigates to /connections when "Connections" button is clicked', () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)
    render(<HomePage user={{ isAdmin: false }} />)
    fireEvent.click(screen.getByText("Connections"))
    expect(navigate).toHaveBeenCalledWith("/connections")
  })

  test("creates a new presentation and navigates to the presentation page", async () => {
    const navigate = jest.fn()
    useNavigate.mockReturnValue(navigate)
    render(<HomePage user={{ isAdmin: false }} />)
    fireEvent.click(screen.getByText("new presentation"))
    // Simulate filling out the presentation form
    fireEvent.change(screen.getByLabelText("Presentation Name"), {
      target: { value: "Test Presentation" },
    })
    fireEvent.click(screen.getByText("Create Presentation"))
    // Simulate successful creation of presentation
    const createdPresentation = { id: "123", name: "Test Presentation" }
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(createdPresentation),
    })
    await screen.findByText("Test Presentation")
    expect(screen.getByText("Test Presentation")).toBeInTheDocument()
    expect(navigate).toHaveBeenCalledWith("/presentation/123")
  })

  test("cancels creating a new presentation", () => {
    render(<HomePage user={{ isAdmin: false }} />)
    fireEvent.click(screen.getByText("new presentation"))
    fireEvent.click(screen.getByText("Cancel"))
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument()
  })
})

describe("PresentationForm", () => {
  test("renders the form with name input field and buttons", () => {
    render(<PresentationForm />)

    expect(screen.getByText("Create new")).toBeInTheDocument()
    expect(screen.getByLabelText("name")).toBeInTheDocument()
    expect(screen.getByText("create")).toBeInTheDocument()
    expect(screen.getByText("cancel")).toBeInTheDocument()
  })

  test("calls createPresentation function when create button is clicked", () => {
    const createPresentationMock = jest.fn()
    render(
      <PresentationForm
        createPresentation={createPresentationMock}
        onCancel={() => {}}
      />
    )

    const nameInput = screen.getByLabelText("name")
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
