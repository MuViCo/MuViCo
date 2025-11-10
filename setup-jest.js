// Polyfill TextEncoder and TextDecoder if they are not defined
if (typeof TextEncoder === "undefined") {
  const util = require("util")
  global.TextEncoder = util.TextEncoder
}
if (typeof TextDecoder === "undefined") {
  const util = require("util")
  global.TextDecoder = util.TextDecoder
}
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})
