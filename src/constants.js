const minPwLength = 8
const maxPwLength = 72

const invalidPwCharRegex =
  /[^a-zA-Z0-9 !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~äöåÄÖÅ]+/

const saltRounds = 10


module.exports = {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
  saltRounds,
}