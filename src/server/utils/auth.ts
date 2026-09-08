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

// pwHash matches bcrypt.compare's own (data: string, encrypted: string)
// signature -- callers with a possibly-undefined passwordHash (a
// Firebase-only account has none) cast at the call site instead of this
// function silently substituting a value bcrypt was never asked to compare
// against.
export const checkPassword = (plaintextPassword: string, pwHash: string) => {
  return bcrypt.compare(plaintextPassword, pwHash)
}

export const generateHash = (plaintextPassword: string) => {
  return bcrypt.hash(plaintextPassword, saltRounds)
}
