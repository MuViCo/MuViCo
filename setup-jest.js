// Polyfill TextEncoder and TextDecoder if they are not defined
if (typeof TextEncoder === "undefined") {
  const util = require("util")
  global.TextEncoder = util.TextEncoder
}
if (typeof TextDecoder === "undefined") {
  const util = require("util")
  global.TextDecoder = util.TextDecoder
}
