import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { ChakraProvider } from "@chakra-ui/react"
import ClickablePopover from "../../components/utils/ClickablePopover"
import { IconButton, Icon } from "@chakra-ui/react"
import { QuestionIcon } from "@chakra-ui/icons"

const renderWithChakra = (component) => {
  return render(<ChakraProvider>{component}</ChakraProvider>)
}

describe("ClickablePopover", () => {
  test("renders trigger button", () => {
    renderWithChakra(
      <ClickablePopover label="Test content">
        <IconButton
          aria-label="Help"
          icon={<QuestionIcon />}
        />
      </ClickablePopover>
    )

    const button = screen.getByLabelText("Help")
    expect(button).toBeInTheDocument()
  })

  test("popover is closed by default", () => {
    renderWithChakra(
      <ClickablePopover label="Test content">
        <IconButton
          aria-label="Help"
          icon={<QuestionIcon />}
        />
      </ClickablePopover>
    )

    const content = screen.queryByText("Test content")
    expect(content).not.toBeVisible()
  })

  test("opens popover when button is clicked", async () => {
    renderWithChakra(
      <ClickablePopover label="Test content">
        <IconButton
          aria-label="Help"
          icon={<QuestionIcon />}
        />
      </ClickablePopover>
    )

    const button = screen.getByLabelText("Help")
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("Test content")).toBeVisible()
    })
  })

  test("closes popover when button is clicked again", async () => {
    renderWithChakra(
      <ClickablePopover label="Test content">
        <IconButton
          aria-label="Help"
          icon={<QuestionIcon />}
        />
      </ClickablePopover>
    )

    const button = screen.getByLabelText("Help")

    // Open
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText("Test content")).toBeVisible()
    })

    // Close
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.queryByText("Test content")).not.toBeVisible()
    })
  })

  test("renders HTML content in label", async () => {
    renderWithChakra(
      <ClickablePopover label={<><b>Bold</b> text</>}>
        <IconButton
          aria-label="Help"
          icon={<QuestionIcon />}
        />
      </ClickablePopover>
    )

    const button = screen.getByLabelText("Help")
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("Bold")).toBeVisible()
    })
  })
})