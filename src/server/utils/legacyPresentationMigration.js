const { getAudioRow, getCueTypeFromScreen, getMaxLayers } = require("./cueType")

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key)

const isFiniteNumber = (value) => Number.isFinite(Number(value))
const isValidLayerNumber = (value) => Number.isInteger(Number(value))

const normalizeCue = (cue, screenCount) => {
  const nextCue = { ...cue }
  const changes = []

  const cueType =
    nextCue.cueType === "visual" || nextCue.cueType === "audio"
      ? nextCue.cueType
      : getCueTypeFromScreen(nextCue.screen, screenCount)

  if (nextCue.cueType !== cueType) {
    nextCue.cueType = cueType
    changes.push("cueType")
  }

  if (
    !hasOwn(nextCue, "layer") ||
    nextCue.layer === null ||
    !isValidLayerNumber(nextCue.layer)
  ) {
    nextCue.layer = 0
    changes.push("layer")
  }

  const layer = Number(nextCue.layer)
  if (layer < 0 || layer >= getMaxLayers(cueType)) {
    nextCue.layer = 0
    changes.push("layer")
  }

  if (
    !hasOwn(nextCue, "opacity") ||
    nextCue.opacity === null ||
    !isFiniteNumber(nextCue.opacity) ||
    Number(nextCue.opacity) < 0 ||
    Number(nextCue.opacity) > 1
  ) {
    nextCue.opacity = 1
    changes.push("opacity")
  }

  if (
    !hasOwn(nextCue, "continuePlayback") ||
    nextCue.continuePlayback === null
  ) {
    nextCue.continuePlayback = false
    changes.push("continuePlayback")
  }

  if (
    cueType === "audio" &&
    Number(nextCue.screen) !== getAudioRow(screenCount)
  ) {
    nextCue.screen = getAudioRow(screenCount)
    changes.push("screen")
  }

  return { cue: nextCue, changes }
}

const normalizedSlotKey = (cue, screenCount) => {
  const cueType =
    cue.cueType === "visual" || cue.cueType === "audio"
      ? cue.cueType
      : getCueTypeFromScreen(cue.screen, screenCount)
  const screen =
    cueType === "audio" ? getAudioRow(screenCount) : Number(cue.screen)
  return [Number(cue.index), screen, Number(cue.layer ?? 0)].join(":")
}

const normalizePresentation = (presentation) => {
  const screenCount = Number(presentation.screenCount) || 1
  const cues = Array.isArray(presentation.cues) ? presentation.cues : []
  const changedFields = new Set()
  const slotCounts = new Map()

  const normalizedCues = cues.map((cue) => {
    const result = normalizeCue(cue, screenCount)
    result.changes.forEach((field) => changedFields.add(field))
    const key = normalizedSlotKey(result.cue, screenCount)
    slotCounts.set(key, (slotCounts.get(key) || 0) + 1)
    return result.cue
  })

  const duplicateSlots = [...slotCounts.values()].filter(
    (count) => count > 1
  ).length

  return {
    presentation: {
      ...presentation,
      cues: normalizedCues,
    },
    changed: changedFields.size > 0,
    changedFields: [...changedFields].sort(),
    duplicateSlots,
  }
}

const summarizeMigration = (results) => {
  return results.reduce(
    (summary, result) => {
      summary.presentations += 1
      summary.cues += Array.isArray(result.presentation.cues)
        ? result.presentation.cues.length
        : 0
      if (result.changed) {
        summary.changedPresentations += 1
      }
      summary.duplicateSlots += result.duplicateSlots
      for (const field of result.changedFields) {
        summary.changedFields[field] = (summary.changedFields[field] || 0) + 1
      }
      return summary
    },
    {
      presentations: 0,
      cues: 0,
      changedPresentations: 0,
      duplicateSlots: 0,
      changedFields: {},
    }
  )
}

module.exports = {
  normalizeCue,
  normalizePresentation,
  summarizeMigration,
}
