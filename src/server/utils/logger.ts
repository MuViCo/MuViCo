/*
 * Logger utility for server-side logging.
 * Keeps test output quieter by muting info logs while always printing errors.
 *
 * Named exports, not a single default object: every current call site does
 * `const logger = require("./logger")` then `logger.info(...)`, which still
 * works unchanged against named exports (they compile to plain properties on
 * `exports`) but would break against a default export (wrapped in `.default`
 * until every caller is converted too).
 */
export const info = (...params: unknown[]) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(...params)
  }
}

export const error = (...params: unknown[]) => {
  console.error(...params)
}
