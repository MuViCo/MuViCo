// utils/numberInputUtils.js

/**
 * Allows users to type freely, accepting an empty field but blocking non-numeric characters.
 */
export const handleNumericInputChange = (setState) => (value) => {
  const parsedValue = parseInt(value, 10)
  setState(isNaN(parsedValue) ? "" : parsedValue)
}

/**
 * Ensures the final input is a number within min/max bounds when losing focus.
 */
export const validateAndSetNumber = (setState, min, max) => (event) => {
  const parsedValue = parseInt(event.target.value, 10)
  setState(isNaN(parsedValue) ? min : Math.min(Math.max(parsedValue, min), max))
}

/**
 * Finds the next available index for a given screen.
 * Only runs if the screen number is between 1 and 5.
 */
export const getNextAvailableIndex = (screen, cues) => {
  if (screen < 1 || screen > 5 || isNaN(screen)) {
    return 1 // Return defaut index 1 if the screen is invalid
  }

  // Extract and sort the indexes for the selected screen
  const indexes = new Set(
    cues
      .filter((cue) => Number(cue.screen) === Number(screen))
      .map((cue) => Number(cue.index))
  )

  // Find the first available index
  let nextIndex = 0
  while (indexes.has(nextIndex)) {
    nextIndex++
  }

  return nextIndex
}
