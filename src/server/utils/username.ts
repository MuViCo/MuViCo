/*
 * Username utility for normalization and uniqueness generation.
 * Sanitizes preferred usernames and appends numeric suffixes when names already exist.
 */

/*
 * generateUniqueUsername is called with the User model, which isn't typed
 * yet (models/user.ts lands in the next commit). A minimal structural type
 * for the one method actually used avoids a premature dependency on it and
 * still catches a caller passing the wrong thing.
 */
interface UsernameLookup {
  exists: (filter: { username: string }) => Promise<unknown>
}

export const normalizeUsername = (value?: string | null) => {
  const sanitized = (value || "").toLowerCase().replace(/[^a-z0-9._-]/g, "")
  if (sanitized.length >= 3) {
    return sanitized
  }
  return `user${sanitized}`
}

export const generateUniqueUsername = async (
  preferredUsername: string | null | undefined,
  userModel: UsernameLookup
) => {
  const baseUsername = normalizeUsername(preferredUsername)
  let candidate = baseUsername
  let counter = 1

  while (await userModel.exists({ username: candidate })) {
    candidate = `${baseUsername}_${counter}`
    counter += 1
  }

  return candidate
}
