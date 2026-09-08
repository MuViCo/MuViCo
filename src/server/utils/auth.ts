/*
 * Authentication utility for password handling.
 * Validates password rules and provides bcrypt compare/hash helpers.
 */
import bcrypt from "bcrypt"
import {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
  saltRounds,
} from "../../constants.js"

const validationError = (message: string) => {
  const error = new Error(message)
  error.name = "ValidationError"
  return error
}

export const validatePassword = (password: string) => {
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

// pwHash can be undefined for a Firebase-only account (no passwordHash) --
// callers cast at the call site instead of us silently working around it.
export const checkPassword = (plaintextPassword: string, pwHash: string) => {
  return bcrypt.compare(plaintextPassword, pwHash)
}

export const generateHash = (plaintextPassword: string) => {
  return bcrypt.hash(plaintextPassword, saltRounds)
}
