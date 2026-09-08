/*
 * Logger utility for server-side logging.
 * Keeps test output quieter by muting info logs while always printing errors.
 *
 * Named exports here, not a default object -- keeps working with callers
 * still doing `const logger = require("./logger")` until they're converted.
 */
export const info = (...params: unknown[]) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(...params)
  }
}

export const error = (...params: unknown[]) => {
  console.error(...params)
}
