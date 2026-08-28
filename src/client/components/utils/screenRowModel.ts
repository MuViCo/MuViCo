import type {
  CollapsedGroups,
  LaneGroup,
  Cue,
  DropTarget,
  Lane,
  LayerRemovalPlan,
  MinimumLanes,
  RowModel,
} from "../../types"

export const DEFAULT_MAX_VISUAL_LAYERS = 3
export const DEFAULT_MAX_AUDIO_TRACKS = 2

const laneCount = (values: number[]): number =>
  Math.max(1, (values.length ? Math.max(...values) : 0) + 1)

export const buildRowModel = (
  screenCount: number,
  cues: Cue[] = [],
  collapsed: CollapsedGroups = {},
  minimumLanes: MinimumLanes = {}
): RowModel => {
  const rows: Lane[] = []
  const cueY: Record<string, number> = {}
  let y = 0

  const pushLaneRow = (meta: Omit<Lane, "y">, laneCues: Cue[]): void => {
    rows.push({ ...meta, y })
    laneCues.forEach((c: Cue) => {
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

export const getCueRow = (
  cue: Pick<Cue, "_id" | "screen"> | null | undefined,
  cueY: Record<string, number>
): number => {
  // Behaviour-identical to the previous `cueY[cue?._id]`: indexing an object
  // with undefined looks up the key "undefined", which a cue id never is, so
  // both spellings fall through to the screen-derived row.
  const cueId = cue?._id
  const row = cueId === undefined ? undefined : cueY[cueId]
  return row ?? Number(cue?.screen ?? 1) - 1
}

export const laneAt = (rows: Lane[], rowIndex: number): Lane | null =>
  rows[rowIndex] ?? null

/**
 * Type predicate rather than a plain boolean so callers narrow `lane` after the
 * check instead of needing a non-null assertion. It is sound in the direction
 * that matters: whenever it returns true, `lane` is a Lane. Returning false for
 * a real Lane whose kind does not match the cue type is fine.
 */
export const laneAcceptsCueType = (
  lane: Lane | null | undefined,
  cueType: string
): lane is Lane => {
  if (!lane) return false
  const isAudioLane = lane.kind === "audio-track" || lane.kind === "audio"
  return cueType === "audio" ? isAudioLane : !isAudioLane
}

export const dropTargetAt = (
  rows: Lane[],
  rowIndex: number,
  cueType: string,
  screenCount: number
): DropTarget | null => {
  const lane = laneAt(rows, rowIndex)
  if (!laneAcceptsCueType(lane, cueType)) return null
  if (cueType === "audio") {
    return { screen: Number(screenCount) + 1, layer: lane.layer ?? 0 }
  }
  return { screen: lane.screen, layer: lane.layer ?? 0 }
}

export const planVisualLayerRemoval = (
  cues: Cue[] = [],
  screen: number,
  layer: number
): LayerRemovalPlan => {
  const targetScreen = Number(screen)
  const targetLayer = Number(layer)

  if (!Number.isInteger(targetLayer) || targetLayer <= 0) {
    return { removedCueIds: [], shiftedCues: [] }
  }

  return cues.reduce<LayerRemovalPlan>(
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

/**
 * Collapses a lane list into its contiguous per-screen (and audio) runs.
 *
 * Adjacency grouping is exact rather than a heuristic: buildRowModel walks
 * screens in order and emits each screen's lanes consecutively before moving on,
 * then appends the audio lanes. Two runs of the same group can therefore never
 * be separated by another group's lanes.
 */
export const groupLanes = (rows: Lane[]): LaneGroup[] =>
  rows.reduce<LaneGroup[]>((groups, row) => {
    const current = groups[groups.length - 1]

    if (current && current.group === row.group) {
      current.laneCount += 1
      return groups
    }

    groups.push({
      group: row.group,
      kind: row.kind,
      // The group-start lane of an expanded screen carries screenLabel ("Screen 3")
      // while its own label is the layer ("L1"); a collapsed lane only has label.
      label: row.screenLabel ?? row.label,
      screen: row.screen,
      startY: row.y,
      laneCount: 1,
      collapsed: Boolean(row.collapsed),
    })
    return groups
  }, [])
