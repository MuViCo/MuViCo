import {
  consumeLoginRedirect,
  rememberLoginRedirect,
} from "../../utils/loginRedirect"

describe("loginRedirect", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  test("hands back a remembered share link once", () => {
    rememberLoginRedirect("/shared/abc_DEF-123")

    expect(consumeLoginRedirect()).toBe("/shared/abc_DEF-123")
    expect(consumeLoginRedirect()).toBeNull()
  })

  test("also remembers a share link's Show mode page", () => {
    rememberLoginRedirect("/shared/abc_DEF-123/show")

    expect(consumeLoginRedirect()).toBe("/shared/abc_DEF-123/show")
  })

  test("returns null when nothing was remembered", () => {
    expect(consumeLoginRedirect()).toBeNull()
  })

  test.each([
    "/home",
    "/presentation/123",
    "//evil.example.com",
    "https://evil.example.com/shared/abc",
    "/shared/abc/extra",
    "/shared/abc/show/more",
    "/shared/",
    "/shared/a b",
  ])("does not remember %s", (path) => {
    rememberLoginRedirect(path)

    expect(window.sessionStorage.getItem("redirectAfterLogin")).toBeNull()
    expect(consumeLoginRedirect()).toBeNull()
  })

  test("ignores a tampered stored value", () => {
    window.sessionStorage.setItem("redirectAfterLogin", "//evil.example.com")

    expect(consumeLoginRedirect()).toBeNull()
    expect(window.sessionStorage.getItem("redirectAfterLogin")).toBeNull()
  })

  test("reads as nothing when storage is blocked", () => {
    const spy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })

    expect(consumeLoginRedirect()).toBeNull()

    spy.mockRestore()
  })

  test("survives blocked storage", () => {
    const spy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked")
      })

    expect(() => rememberLoginRedirect("/shared/abc")).not.toThrow()

    spy.mockRestore()
  })
})
