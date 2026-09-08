/*
 * Logger utility for server-side logging.
 * Keeps test output quieter by muting info logs while always printing errors.
 */
const info = (...params) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(...params)
  }
}

const error = (...params) => {
  console.error(...params)
}

module.exports = {
  info,
  error,
}
