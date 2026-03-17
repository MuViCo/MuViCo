const { validatePassword } = require("../utils/auth.js")

describe("Password validation", () => {
    test("rejects too short password", () => {
        expect(validatePassword("ABCD")).toBe(false)
    })

    test("rejects too long password", () => {
        expect(validatePassword("AABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDBCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD")).toBe(false)
    })

    test("rejects invalid characters", () => {
        expect(validatePassword("🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀")).toBe(false)
    })

    test("accepts all valid characters", () => {
        expect(validatePassword("åäöÅÄÖ0123456789 !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~")).toBe(true)
    })
})
