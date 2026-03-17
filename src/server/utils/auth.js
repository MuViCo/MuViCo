const bcrypt = require("bcrypt")
const {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
  saltRounds,
} = require("../../constants.js")

const validatePassword = (password) => {
  if (password.length < minPwLength) return false

  if (password.length > maxPwLength) return false

  if (password.match(invalidPwCharRegex)) return false

  return true
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
