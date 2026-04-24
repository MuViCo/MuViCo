/*
 * Authentication utility for password handling.
 * Validates password rules and provides bcrypt compare/hash helpers.
 */
const bcrypt = require("bcrypt")
const {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
  saltRounds,
} = require("../../constants.js")

const validationError = (message) => {
  const error = new Error(message)
  error.name = "ValidationError"
  return error
}

const validatePassword = (password) => {
  if (password.trim().length === 0) {
    throw validationError("password cannot contain only spaces")
  }

  if (password.length < minPwLength) {
    throw validationError(`password must be at least ${minPwLength} characters`)
  }

  if (password.length > maxPwLength) {
    throw validationError(`password must be at most ${maxPwLength} characters`)
  }

  if (invalidPwCharRegex.test(password)) {
    throw validationError("password contains unsupported characters")
  }
}

const checkPassword = (plaintextPassword, pwHash) => {
  return bcrypt.compare(plaintextPassword, pwHash)
}

const generateHash = (plaintextPassword) => {
  return bcrypt.hash(plaintextPassword, saltRounds)
}

module.exports = {
  validatePassword,
  checkPassword,
  generateHash,
}
