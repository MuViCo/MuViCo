interface ScreenBearingShape {
  screen?: number | string
  spanScreens?: number[] | null
}

type ScreenBearing = ScreenBearingShape | null | undefined

export const occupiedScreens = (cue: ScreenBearing): number[] =>
  Array.isArray(cue?.spanScreens) && cue.spanScreens.length > 1
    ? cue.spanScreens.map(Number)
    : [Number(cue?.screen)]

export const occupiesScreen = (
  cue: ScreenBearing,
  screenNumber: number
): boolean => occupiedScreens(cue).includes(Number(screenNumber))

export const spansOntoScreen = (
  cue: ScreenBearing,
  screenNumber: number
): boolean =>
  Number(cue?.screen) !== Number(screenNumber) &&
  occupiesScreen(cue, screenNumber)
