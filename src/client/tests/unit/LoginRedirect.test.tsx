import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import LoginRedirect from "../../components/utils/LoginRedirect"
import { consumeLoginRedirect } from "../../utils/loginRedirect"

const mockShowToast = jest.fn()
jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => mockShowToast,
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>front page</div>} />
        <Route path="/shared/:token" element={<LoginRedirect />} />
      </Routes>
    </MemoryRouter>
  )

describe("LoginRedirect", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    mockShowToast.mockClear()
  })

  test("sends the visitor to the front page", () => {
    renderAt("/shared/tok-abc")

    expect(screen.getByText("front page")).toBeInTheDocument()
  })

  test("remembers the share link for after login", () => {
    renderAt("/shared/tok-abc")

    expect(consumeLoginRedirect()).toBe("/shared/tok-abc")
  })

  test("tells the visitor why they were sent to log in", () => {
    renderAt("/shared/tok-abc")

    expect(mockShowToast).toHaveBeenCalledTimes(1)
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Log in to continue", status: "info" })
    )
  })
})
