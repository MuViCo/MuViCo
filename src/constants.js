/* password validation constants */

export const minPwLength = 8
export const maxPwLength = 72

export const invalidPwCharRegex =
  /[^a-zA-Z0-9 !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~äöåÄÖÅ]+/

export const pwAlphaNumRegex = 
  /^(?=.*[A-Za-z])(?=.*\d).+$/ // Require at least one letter and one number


/* username validation constants */

export const minUnLength = 3
export const maxUnLength = 30

export const unAllowedCharsRegex = /^[A-Za-z0-9._-]+$/ // Username is limited to letters, numbers, dot, underscore and hyphen

export const unStartEndRegex = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/ // Username must start and end with alphanumeric characters

export const unConsecutiveSpecialsRegex = /[._-]{2,}/ // Prevent repetitive separators


/* bcrypt salt rounds */

export const saltRounds = 10