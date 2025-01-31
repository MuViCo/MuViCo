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
 * Finds the next available index for a given screen, ensuring no gaps in sequence.
 * Only runs if the screen number is between 1 and 4.
 */
export const getNextAvailableIndex = (screen, cues) => {
  if (screen < 1 || screen > 4 || isNaN(screen)) {
    console.log(`Invalid screen: ${screen}. Returning default index 1.`)
    return 1
  }

  // Get all indexes for the selected screen
  const indexes = cues
    .filter((cue) => Number(cue.screen) === Number(screen)) // Filter by selected screen
    .map((cue) => Number(cue.index)) // Convert to numbers
    .sort((a, b) => a - b) // Sort in ascending order

  console.log(`Indexes for screen ${screen}:`, indexes)

  // Find the first missing index starting from 0
  let nextIndex = 0
  for (let i = 0; i < indexes.length; i++) {
    if (indexes[i] !== nextIndex) {
      console.log(`Found gap: nextIndex=${nextIndex}`)
      return nextIndex // Return the first missing number in sequence
    }
    nextIndex++
  }

  console.log(`No gaps found, next available index: ${nextIndex}`)
  return nextIndex // If no gaps, return the next number in sequence
}
