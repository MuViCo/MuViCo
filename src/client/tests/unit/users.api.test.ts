/*
 * Users service API unit tests.
 * Verifies endpoint paths, authorization header usage and payload forwarding
 * for linking and unlinking a Google Drive account.
 */
import axios from "axios"
import usersService from "../../services/users"

jest.mock("axios")

const mockedPost = jest.mocked(axios.post)

describe("users service api", () => {
  // No user in localStorage, so getToken() returns null and the header is
  // built from it verbatim -- same expectation as the other service tests.
  const token = "Bearer null"

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("linkDrive posts the drive token to /api/users/link-drive", async () => {
    const updatedUser = { id: "1", username: "tester", driveToken: "drive-abc" }
    mockedPost.mockResolvedValue({ data: updatedUser })

    const result = await usersService.linkDrive({
      driveAccessToken: "drive-abc",
    })

    expect(result).toEqual(updatedUser)
    expect(mockedPost).toHaveBeenCalledWith(
      "/api/users/link-drive",
      { driveAccessToken: "drive-abc" },
      { headers: { Authorization: token } }
    )
  })

  test("unlinkDrive posts an empty body to /api/users/unlink-drive", async () => {
    const updatedUser = { id: "1", username: "tester", driveToken: null }
    mockedPost.mockResolvedValue({ data: updatedUser })

    const result = await usersService.unlinkDrive()

    expect(result).toEqual(updatedUser)
    expect(mockedPost).toHaveBeenCalledWith(
      "/api/users/unlink-drive",
      {},
      { headers: { Authorization: token } }
    )
  })

  test("linkDrive propagates a rejected request to the caller", async () => {
    mockedPost.mockRejectedValue(new Error("network down"))

    await expect(
      usersService.linkDrive({ driveAccessToken: "drive-abc" })
    ).rejects.toThrow("network down")
  })
})
