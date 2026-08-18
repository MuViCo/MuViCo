export const DEFAULT_MAX_VISUAL_LAYERS = 3
export const DEFAULT_MAX_AUDIO_TRACKS = 2

const laneCount = (values) =>
  Math.max(1, (values.length ? Math.max(...values) : 0) + 1)

export const buildRowModel = (
  screenCount,
  cues = [],
  collapsed = {},
  minimumLanes = {}
) => {
  const rows = []
  const cueY = {}
  let y = 0

  const pushLaneRow = (meta, laneCues) => {
    rows.push({ ...meta, y })
    laneCues.forEach((c) => {
      if (c?._id != null) cueY[c._id] = y
    })
    y += 1
  }

  for (let s = 1; s <= screenCount; s++) {
    const group = `screen-${s}`
    const screenCues = cues.filter(
      (c) => c.cueType === "visual" && Number(c.screen) === s
    )
    const layers = screenCues.map((c) => Number(c.layer ?? 0))
    const presentLayers = [...new Set(layers)]

    const minimumLayerCount = Number(minimumLanes[group] ?? 1)
    const requiredLayerCount = laneCount(layers)

    if (collapsed[group]) {
      const count = Math.max(presentLayers.length, minimumLayerCount)
      pushLaneRow(
        {
          kind: "screen",
          group,
          screen: s,
          collapsed: true,
          count,
          label: `Screen ${s}`,
          groupStart: true,
        },
        screenCues
      )
    } else {
      const count = Math.min(
        DEFAULT_MAX_VISUAL_LAYERS,
        Math.max(requiredLayerCount, minimumLayerCount)
      )
      for (let L = 0; L < count; L++) {
        pushLaneRow(
          {
            kind: "layer",
            group,
            screen: s,
            layer: L,
            label: `L${L + 1}`,
            laneTotal: count,
            canRemoveLayer: L > 0,
            groupStart: L === 0,
            screenLabel: `Screen ${s}`,
          },
          screenCues.filter((c) => Number(c.layer ?? 0) === L)
        )
      }
    }
  }

  const audioCues = cues.filter((c) => c.cueType === "audio")
  const audioTracks = audioCues.map((c) => Number(c.layer ?? 0))
  const presentTracks = [...new Set(audioTracks)]

  const minimumAudioTrackCount = Number(minimumLanes.audio ?? 1)

  if (collapsed.audio) {
    pushLaneRow(
      {
        kind: "audio",
        group: "audio",
        screen: Number(screenCount) + 1,
        collapsed: true,
        count: Math.max(presentTracks.length, minimumAudioTrackCount),
        label: "Audio",
        groupStart: true,
      },
      audioCues
    )
  } else {
    const count = Math.min(
      DEFAULT_MAX_AUDIO_TRACKS,
      Math.max(laneCount(audioTracks), minimumAudioTrackCount)
    )
    for (let T = 0; T < count; T++) {
      pushLaneRow(
        {
          kind: "audio-track",
          group: "audio",
          screen: Number(screenCount) + 1,
          layer: T,
          label: `A${T + 1}`,
          laneTotal: count,
          groupStart: T === 0,
        },
        audioCues.filter((c) => Number(c.layer ?? 0) === T)
      )
    }
  }

  return { rows, cueY, rowCount: y }
}

export const getCueRow = (cue, cueY) =>
  cueY[cue?._id] ?? Number(cue?.screen ?? 1) - 1

export const laneAt = (rows, rowIndex) => rows[rowIndex] ?? null

export const laneAcceptsCueType = (lane, cueType) => {
  if (!lane) return false
  const isAudioLane = lane.kind === "audio-track" || lane.kind === "audio"
  return cueType === "audio" ? isAudioLane : !isAudioLane
}

export const dropTargetAt = (rows, rowIndex, cueType, screenCount) => {
  const lane = laneAt(rows, rowIndex)
  if (!laneAcceptsCueType(lane, cueType)) return null
  if (cueType === "audio") {
    return { screen: Number(screenCount) + 1, layer: lane.layer ?? 0 }
  }
  return { screen: lane.screen, layer: lane.layer ?? 0 }
}

export const planVisualLayerRemoval = (cues = [], screen, layer) => {
  const targetScreen = Number(screen)
  const targetLayer = Number(layer)

  if (!Number.isInteger(targetLayer) || targetLayer <= 0) {
    return { removedCueIds: [], shiftedCues: [] }
  }

  return cues.reduce(
    (plan, cue) => {
      const cueLayer = Number(cue.layer ?? 0)
      const isTargetScreenVisual =
        cue.cueType === "visual" && Number(cue.screen) === targetScreen

      if (!isTargetScreenVisual) {
        return plan
      }

      if (cueLayer === targetLayer) {
        if (cue._id != null) {
          plan.removedCueIds.push(cue._id)
        }
        return plan
      }

      if (cueLayer > targetLayer) {
        plan.shiftedCues.push({ ...cue, layer: cueLayer - 1 })
      }

      return plan
    },
    { removedCueIds: [], shiftedCues: [] }
  )
}
