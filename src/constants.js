/* password validation constants */

export const minPwLength = 8
export const maxPwLength = 72

export const invalidPwCharRegex =
  /[^a-zA-Z0-9 !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~äöåÄÖÅ]+/

/* username validation constants */

export const minUsernameLength = 3
export const maxUsernameLength = 30

export const usernameAllowedCharsRegex = /^[A-Za-z0-9._-]+$/ // Username is limited to letters, numbers, dot, underscore and hyphen

export const usernameStartEndRegex =
  /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/ // Username must start and end with alphanumeric characters

export const usernameConsecutiveSpecialsRegex = /[._-]{2,}/ // Prevent repetitive separators

/* bcrypt salt rounds */

export const saltRounds = 10

export const DEFAULT_OUTPUT_ASPECT_RATIO = "16:9"

export const OUTPUT_ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "16:9 (widescreen)" },
  { value: "16:10", label: "16:10" },
  { value: "4:3", label: "4:3" },
  { value: "21:9", label: "21:9 (ultrawide)" },
  { value: "1:1", label: "1:1 (square)" },
]

export const aspectRatioRegex = /^([1-9][0-9]{0,2}):([1-9][0-9]{0,2})$/

export const isValidAspectRatio = (value) =>
  typeof value === "string" && aspectRatioRegex.test(value)

export const parseAspectRatio = (value) => {
  const match = typeof value === "string" ? value.match(aspectRatioRegex) : null
  if (!match) return 16 / 9

  const width = Number(match[1])
  const height = Number(match[2])
  return height > 0 ? width / height : 16 / 9
}

export const resolveScreenAspectRatio = (
  screenAspectRatios,
  screenNumber,
  fallback
) => {
  const perScreen =
    screenAspectRatios && typeof screenAspectRatios === "object"
      ? screenAspectRatios[String(screenNumber)]
      : undefined

  if (isValidAspectRatio(perScreen)) return perScreen
  if (isValidAspectRatio(fallback)) return fallback
  return DEFAULT_OUTPUT_ASPECT_RATIO
}
