/* password validation constants */

const minPwLength = 8
const maxPwLength = 72

const invalidPwCharRegex =
  /[^a-zA-Z0-9 !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~äöåÄÖÅ]+/


/* username validation constants */

const minUsernameLength = 3
const maxUsernameLength = 30

const usernameAllowedCharsRegex = /^[A-Za-z0-9._-]+$/ // Username is limited to letters, numbers, dot, underscore and hyphen

const usernameStartEndRegex = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/ // Username must start and end with alphanumeric characters

const usernameConsecutiveSpecialsRegex = /[._-]{2,}/ // Prevent repetitive separators


/* bcrypt salt rounds */

const saltRounds = 10

module.exports = {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
  minUsernameLength,
  maxUsernameLength,
  usernameAllowedCharsRegex,
  usernameStartEndRegex,
  usernameConsecutiveSpecialsRegex,
  saltRounds,
}