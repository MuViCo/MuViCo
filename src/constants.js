/* password validation constants */

export const minPwLength = 8
export const maxPwLength = 72

export const invalidPwCharRegex =
  /[^a-zA-Z0-9 !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~äöåÄÖÅ]+/


/* username validation constants */

export const minUsernameLength = 3
export const maxUsernameLength = 30

export const usernameAllowedCharsRegex = /^[A-Za-z0-9._-]+$/ // Username is limited to letters, numbers, dot, underscore and hyphen

export const usernameStartEndRegex = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/ // Username must start and end with alphanumeric characters

export const usernameConsecutiveSpecialsRegex = /[._-]{2,}/ // Prevent repetitive separators


/* bcrypt salt rounds */

export const saltRounds = 10
