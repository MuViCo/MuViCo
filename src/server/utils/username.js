const normalizeUsername = (value) => {
  const sanitized = (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
  if (sanitized.length >= 3) {
    return sanitized
  }
  return `user${sanitized}`
}

const generateUniqueUsername = async (preferredUsername, userModel) => {
  const baseUsername = normalizeUsername(preferredUsername)
  let candidate = baseUsername
  let counter = 1

  while (await userModel.exists({ username: candidate })) {
    candidate = `${baseUsername}_${counter}`
    counter += 1
  }

  return candidate
}

module.exports = {
  normalizeUsername,
  generateUniqueUsername,
}
