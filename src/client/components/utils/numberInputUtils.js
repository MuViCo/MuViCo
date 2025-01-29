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
