const bcrypt = require("bcrypt")
const { minPwLength, maxPwLength } = require("../../constants.js")

const saltrounds = 10

const validatePassword = (password) => {
  if (password.length < minPwLength) {
    return false
  }
  if (password.length > maxPwLength) {
    return false
  }
  return true
}

const checkPassword = async (plaintextPassword, pwHash) => {
  return await bcrypt.compare(plaintextPassword, pwHash)
}

const generateHash = async (plaintextPassword) => {
  return await bcrypt.hash(plaintextPassword, saltrounds)
}

module.exports = {
  validatePassword,
  checkPassword,
  generateHash,
}
