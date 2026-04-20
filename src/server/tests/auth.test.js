const { validatePassword } = require("../utils/auth.js")
const { minPwLength
    , maxPwLength
 } = require("../../constants.js")

describe("Password validation", () => {
    test("rejects too short password", () => {
        expect(() => validatePassword("ABCD")).toThrow(
            `password must be at least ${minPwLength} characters`
        )
    })

    test("rejects too long password", () => {
        expect(() =>
            validatePassword(
                "AABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDBCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD"
            )
        ).toThrow(`password must be at most ${maxPwLength} characters`)
    })

    test("rejects invalid characters", () => {
        expect(() => validatePassword("🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀")).toThrow(
            "password contains unsupported characters"
        )
    })

    test("accepts all valid characters", () => {
        expect(() =>
            validatePassword("åäöÅÄÖ0123456789 !\"#$%&'()*+,-./:;<=>?@[]^_`{|}~")
        ).not.toThrow()
    })
})
