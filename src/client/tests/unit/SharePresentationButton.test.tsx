import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { ChakraProvider } from "@chakra-ui/react"
import presentationReducer from "../../redux/presentationReducer"
import SharePresentationButton from "../../components/presentation/SharePresentationButton"
import presentationService from "../../services/presentation"

const mockShowToast = jest.fn()
jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => mockShowToast,
}))

jest.mock("copy-to-clipboard", () => jest.fn(() => true))

jest.mock("../../services/presentation", () => ({
  __esModule: true,
  default: {
    enableSharing: jest.fn(),
    disableSharing: jest.fn(),
  },
}))

const mockedService = presentationService as jest.Mocked<
  typeof presentationService
>

const renderButton = (shareToken: string | null = null) => {
  const store = configureStore({
    reducer: { presentation: presentationReducer },
    preloadedState: {
      presentation: {
        cues: [],
        scores: [],
        media: [],
        name: "Show",
        screenCount: 1,
        indexCount: 5,
        shareToken,
        pendingSaves: 0,
      },
    },
  })
  render(
    <Provider store={store}>
      <ChakraProvider>
        <SharePresentationButton presentationId="pres-1" />
      </ChakraProvider>
    </Provider>
  )
  fireEvent.click(screen.getByRole("button", { name: /share/i }))
  return store
}

describe("SharePresentationButton", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("a private presentation offers to create a link", () => {
    renderButton(null)

    expect(screen.getByText(/This presentation is private/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Create link" })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Share link")).not.toBeInTheDocument()
  })

  test("creating a link shows the shareable URL", async () => {
    mockedService.enableSharing.mockResolvedValue("tok-new")
    renderButton(null)

    fireEvent.click(screen.getByRole("button", { name: "Create link" }))

    const input = await screen.findByLabelText("Share link")
    expect(mockedService.enableSharing).toHaveBeenCalledWith("pres-1")
    expect(input).toHaveValue(`${window.location.origin}/shared/tok-new`)
    expect(screen.getByText(/cannot edit it/)).toBeInTheDocument()
  })

  test("an already shared presentation shows its existing link", () => {
    renderButton("tok-existing")

    expect(screen.getByLabelText("Share link")).toHaveValue(
      `${window.location.origin}/shared/tok-existing`
    )
    expect(
      screen.getByRole("button", { name: "Stop sharing" })
    ).toBeInTheDocument()
  })

  test("focusing the link selects it, ready to copy", () => {
    const select = jest.spyOn(HTMLInputElement.prototype, "select")
    renderButton("tok-existing")

    fireEvent.focus(screen.getByLabelText("Share link"))

    expect(select).toHaveBeenCalled()
    select.mockRestore()
  })

  test("copying the link says so", async () => {
    renderButton("tok-existing")

    fireEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(
      await screen.findByRole("button", { name: "Copied" })
    ).toBeInTheDocument()
  })

  test("stopping sharing takes the link away", async () => {
    mockedService.disableSharing.mockResolvedValue(undefined)
    const store = renderButton("tok-existing")

    fireEvent.click(screen.getByRole("button", { name: "Stop sharing" }))

    await waitFor(() =>
      expect(store.getState().presentation.shareToken).toBeNull()
    )
    expect(mockedService.disableSharing).toHaveBeenCalledWith("pres-1")
    expect(screen.queryByLabelText("Share link")).not.toBeInTheDocument()
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sharing stopped", status: "success" })
    )
  })

  test("a refusal from the server is shown and no link appears", async () => {
    mockedService.enableSharing.mockRejectedValue({
      response: {
        data: {
          error:
            "Sharing is not available for presentations stored on Google Drive",
        },
      },
    })
    const store = renderButton(null)

    fireEvent.click(screen.getByRole("button", { name: "Create link" }))

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          description:
            "Sharing is not available for presentations stored on Google Drive",
        })
      )
    )
    expect(store.getState().presentation.shareToken).toBeNull()
    expect(screen.queryByLabelText("Share link")).not.toBeInTheDocument()
  })
})
