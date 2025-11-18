// Polyfill TextEncoder and TextDecoder if they are not defined
if (typeof TextEncoder === "undefined") {
  const util = require("util")
  global.TextEncoder = util.TextEncoder
}

// Ensure tutorial 'seen' flags are set in test environment so the overlay doesn't block interactions
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.setItem('hasSeenHelp_homepage', 'true')
    window.localStorage.setItem('hasSeenHelp_presentation', 'true')
  } catch (e) {
    // ignore (some envs may throw)
  }
}
if (typeof TextDecoder === "undefined") {
  const util = require("util")
  global.TextDecoder = util.TextDecoder
}
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}
