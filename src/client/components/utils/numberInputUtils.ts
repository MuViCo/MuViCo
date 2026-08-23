/** numberInputUtils.ts
 * Utility functions for handling numeric input fields, including validation and index management for cues.
 */

import type { Cue } from "../../types"

/**
 * Allows users to type freely, accepting an empty field but blocking non-numeric characters.
 *
 * The setter accepts `number | ""` because that is exactly what this passes it:
 * an empty string is how the caller represents a cleared field.
 */
export const handleNumericInputChange =
  (setState: (value: number | "") => void) =>
  (value: string): void => {
    const parsedValue = parseInt(value, 10)
    setState(isNaN(parsedValue) ? "" : parsedValue)
  }

/**
 * Ensures the final input is a number within min/max bounds when losing focus.
 *
 * The event is typed structurally rather than as a React.FocusEvent so this
 * module stays free of React types; only `target.value` is ever read.
 */
export const validateAndSetNumber =
  (setState: (value: number) => void, min: number, max: number) =>
  (event: { target: { value: string } }): void => {
    const parsedValue = parseInt(event.target.value, 10)
    setState(
      isNaN(parsedValue) ? min : Math.min(Math.max(parsedValue, min), max)
    )
  }

/**
 * Finds the next available index for a given screen.
 * Only runs if the screen number is between 1 and 5.
 */
export const getNextAvailableIndex = (screen: number, cues: Cue[]): number => {
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
