/*
* edit mode component for presentation view, includes the grid and toolbox for adding/editing cues
* Props:
- id: presentation id
- cues: list of cues in the presentation
- isToolboxOpen: whether the toolbox is open
- setIsToolboxOpen: function to set whether the toolbox is open
- isShowMode: whether currently in show mode (vs edit mode)
- cueIndex: index of the cue currently being edited (if any)
- isAudioMuted: whether audio is currently muted in show mode
- toggleAudioMute: function to toggle audio mute in show mode
- indexCount: number of indexes (frames) in the presentation
 */
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Box, Text, useOutsideClick, useColorModeValue } from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import {
  TIMELINE_METRICS,
  columnLeft,
  laneSpanHeight,
  laneTop,
  timelineRowsTopOffset,
} from "./timelineMetrics"
import { laneKey } from "../utils/laneFocus"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"

import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
} from "react"
import type {
  AlertData,
  CueFileMeta,
  CollapsedGroups,
  Cue,
  CueUpdateInput,
  CueUploadFile,
  HeaderActions,
  Lane,
  MinimumLanes,
  NewCueDragData,
} from "../../types"

interface EditModeProps {
  id: string
  cues: Cue[]
  isToolboxOpen: boolean
  setIsToolboxOpen: (open: boolean) => void
  cueIndex: number
  isAudioMuted: boolean
  toggleAudioMute: () => void
  indexCount: number
  /** Stable "group:layer" key of the focused lane, or null. */
  focusedLaneKey?: string | null
  onFocusLane?: (laneKey: string | null) => void
}

/**
 * event.target is typed EventTarget, which has no closest(). These handlers are
 * only ever reached from a pointer event on an element, so the narrowing is
 * safe -- and `closest` on a non-element would already throw today.
 */
const targetElement = (event: { target: EventTarget | null }): HTMLElement =>
  event.target as HTMLElement

/** A grid cell, in column (frame) and row (lane) indices. */
interface GridCell {
  xIndex: number
  yIndex: number
}
import {
  updatePresentation,
  createCue,
  removeCue,
  swapCues,
  incrementIndexCount,
  decrementIndexCount,
  incrementScreenCount,
  decrementScreenCount,
  shiftPresentationIndexes,
  fetchPresentationInfo,
} from "../../redux/presentationReducer"
import { saveIndexCount, saveScreenCount } from "../../redux/presentationThunks"
import { createFormData } from "../utils/formDataUtils"
import ToolBox from "./ToolBox"
import GridLayoutComponent from "./GridLayoutComponent"
import useEditModeDragPreviewState from "./useEditModeDragPreviewState"
import useEditModeDragPreviewController from "./useEditModeDragPreviewController"
import {
  buildCueVisualSpanMap,
  getCueVisualSpanFromMap,
} from "../utils/cueVisualSpanUtils"
import { RowHeaders, ColumnHeaders } from "./EditModeHeaders"
import {
  getContinuationShrinkSpanOverrides,
  getCueTypeFromDragData,
  getDragDataFromDataTransfer,
} from "./editModeDragHelpers"
import CustomAlert from "../utils/CustomAlert"
import Dialog from "../utils/AlertDialog"
import { useCustomToast } from "../utils/toastUtils"
import screenIcon from "../../public/icons/screen.svg"
import {
  getAudioRow,
  isAudioMimeType,
  isImageOrVideoMimeType,
} from "../utils/fileTypeUtils"
import {
  buildRowModel,
  DEFAULT_MAX_AUDIO_TRACKS,
  DEFAULT_MAX_VISUAL_LAYERS,
  laneAcceptsCueType,
  laneAt,
  planVisualLayerRemoval,
} from "../utils/screenRowModel"
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"
import mediaStore from "./mediaFileStore"

/**
 * EditMode Component - Main editing interface for presentations
 * Manages grid layout, drag-and-drop, frame/screen management
 * Props:
 * - id: presentation ID
 * - cues: array of cues in the presentation
 * - isToolboxOpen: toolbox visibility state
 * - setIsToolboxOpen: function to toggle toolbox
 * - isShowMode: whether in presentation show mode vs edit mode
 * - cueIndex: current cue index being edited
 * - isAudioMuted: audio mute state
 * - toggleAudioMute: function to toggle audio mute
 * - indexCount: number of frames/indexes
 */
const EditMode = ({
  id,
  cues,
  isToolboxOpen,
  setIsToolboxOpen,
  cueIndex,
  isAudioMuted,
  toggleAudioMute,
  indexCount,
  // Defaults so the suites that render EditMode with plain props keep working.
  // A no-op rather than a local useState: several of those tests fire mouseUp
  // outside act(), and a state update there would warn.
  focusedLaneKey = null,
  onFocusLane = () => {},
}: EditModeProps) => {
  const bgColorHover = useColorModeValue(
    "rgba(154, 109, 151, 0.8)",
    "rgba(72, 26, 68, 0.8)"
  )
  const dragPreviewValidBg = useColorModeValue(
    "rgba(127, 212, 238, 0.18)",
    "rgba(127, 212, 238, 0.24)"
  )
  const dragPreviewInvalidBg = useColorModeValue(
    "rgba(229, 138, 156, 0.2)",
    "rgba(229, 138, 156, 0.28)"
  )
  const dragPreviewValidBorder = useColorModeValue("#7fd4ee", "#9be2f7")
  const dragPreviewInvalidBorder = useColorModeValue("#e58a9c", "#f0a2b1")
  const dragPreviewOriginBorder = useColorModeValue("#c9b7f8", "#d8c8ff")
  // Dark-mode values come from the editor design draft: deep near-black violets
  // for surfaces, and one light chip with dark text to mark the active frame,
  // rather than colouring whole rows.
  const timelineSurface = useColorModeValue("#eedef7", "#241333")
  const bgColorIndex = useColorModeValue("rgb(240, 197, 255)", "#ab89d6")
  const bgCurrentFrame = useColorModeValue("purple.300", "#e0c9ff")
  const activeFrameBorderColor = useColorModeValue("#4a0f77", "#c084fc")
  const inactiveFrameBorderColor = useColorModeValue("#b31bff", "#4a2d63")
  const showToast = useCustomToast()
  const dispatch = useAppDispatch()
  const presentation = useAppSelector((state) => state.presentation)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedCue, setSelectedCue] = useState<Cue | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [confirmAction, setConfirmAction] = useState<
    () => void | Promise<void>
  >(() => () => {})
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState<AlertData>({})
  const [collapsedGroups, setCollapsedGroups] = useState<CollapsedGroups>({})
  const [minimumGroupLanes, setMinimumGroupLanes] = useState<MinimumLanes>({})
  const toggleGroupCollapsed = (group: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }))
  const ensureGroupExpanded = (group: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [group]: false }))

  // Generate frame labels for grid columns (Frame 0, Frame 1, etc.)
  const xLabels = useMemo(
    () =>
      Array.from({ length: indexCount }, (_, index) =>
        index === 0 ? "Frame 0" : `Frame ${index}`
      ),
    [indexCount]
  )

  // Filter visual cues only (excludes audio cues)
  const visualCues = useMemo(
    () => cues.filter((cue) => cue.cueType === "visual"),
    [cues]
  )

  const [isDragging, setIsDragging] = useState(false)
  const [dragCursorMode, setDragCursorMode] = useState("default")
  const [isCopied, setIsCopied] = useState(false)
  const [copiedCue, setCopiedCue] = useState<Cue | null>(null)
  const {
    previewCueSpanOverrides,
    clearExternalDragPreview,
    clearInternalDragSpanPreview,
    setExternalDragSpanOverridesIfChanged,
    setInternalDragSpanOverridesIfChanged,
  } = useEditModeDragPreviewState()
  useOutsideClick({
    ref: containerRef,
    handler: () => {
      if (isCopied && !isConfirmOpen) {
        clearExternalPlacementPreview()
        showToast({
          title: "Cancelled copying",
          description: "Copying has been cancelled.",
          status: "info",
        })
        setDragCursorMode("default")
        setIsCopied(false)
        setCopiedCue(null)
        setShowAlert(false)
        setAlertData({})
      }
    },
  })

  // ReturnType<typeof setTimeout> rather than NodeJS.Timeout: this runs in both
  // jsdom and the browser, where setTimeout returns a number.
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasCopiedRef = useRef(false)
  const dragStartPointerRef = useRef<{
    clientX: number
    clientY: number
  } | null>(null)
  const dragHasMovedRef = useRef(false)
  const latestGridDragDataRef = useRef<NewCueDragData | null>(null)
  const latestGridDragCellRef = useRef<GridCell | null>(null)
  const headerActionsRef = useRef<HeaderActions>({
    addIndex: () => {},
    removeIndex: () => {},
    increaseScreenCount: () => {},
    decreaseScreenCount: () => {},
    toggleAudioMute: () => {},
  })

  const { columnWidth, rowHeight, gap, frameHeaderHeight } = TIMELINE_METRICS
  const dragCommitDistancePx = 4

  const cueVisualSpanMap = useMemo(
    () => buildCueVisualSpanMap(cues, indexCount),
    [cues, indexCount]
  )

  const rowModel = useMemo(
    () =>
      buildRowModel(
        // A null screenCount currently yields a row model with no screen
        // lanes; coercing to 1 would invent a screen that is not there.
        presentation.screenCount as number,
        cues,
        collapsedGroups,
        minimumGroupLanes
      ),
    [presentation.screenCount, cues, collapsedGroups, minimumGroupLanes]
  )

  /**
   * Row index of the focused lane, or -1.
   *
   * Falls back to the group's first lane when the exact layer is not present,
   * which is what makes focus survive a collapse: "screen-1:1" resolves to the
   * merged lane while collapsed and back to layer 2 when expanded. A key whose
   * group has disappeared resolves to -1 and is simply inert.
   */
  const focusedRowIndex = useMemo(() => {
    if (!focusedLaneKey) return -1
    const exact = rowModel.rows.findIndex(
      (row) => laneKey(row) === focusedLaneKey
    )
    if (exact !== -1) return exact
    const group = focusedLaneKey.split(":")[0]
    return rowModel.rows.findIndex((row) => row.group === group)
  }, [rowModel.rows, focusedLaneKey])

  /**
   * Row index where the audio section starts, or -1.
   *
   * Audio shares the grid and the scroller with the screens -- its row indices
   * are the same coordinate space every hit test uses -- so the boundary is
   * drawn rather than made structural.
   */
  const audioStartRow = useMemo(() => {
    const index = rowModel.rows.findIndex((row) => row.group === "audio")
    return index
  }, [rowModel.rows])

  /** Focus the lane under the pointer. Never dispatches, never opens anything. */
  const commitLaneFocusFromEvent = (event: ReactMouseEvent) => {
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )
    if (!isRowInsideGrid(xIndex, yIndex)) return
    const lane = laneAt(rowModel.rows, yIndex)
    if (!lane) return
    onFocusLane(laneKey(lane))
  }

  const gridCues = useMemo(
    () =>
      cues.filter((cue) => {
        const row = rowModel.rows[rowModel.cueY[cue._id]]
        return row && !row.collapsed
      }),
    [cues, rowModel]
  )

  const getActiveVisualCueStack = useCallback(
    (screen: number, frameIndex: number) =>
      cues
        .filter(
          (cue) =>
            cue.cueType === "visual" && Number(cue.screen) === Number(screen)
        )
        .filter((cue) => {
          const cueStartIndex = Number(cue.index)
          const cueSpan = getCueVisualSpanFromMap(cue, cueVisualSpanMap)
          const cueEndIndex = cueStartIndex + cueSpan - 1
          return frameIndex >= cueStartIndex && frameIndex <= cueEndIndex
        })
        .sort(
          (firstCue, secondCue) =>
            Number(secondCue.layer ?? 0) - Number(firstCue.layer ?? 0)
        ),
    [cues, cueVisualSpanMap]
  )

  const collapsedVisualRowPreviews = useMemo(
    () =>
      rowModel.rows
        .filter((row) => row.collapsed && row.kind === "screen")
        .map((row) => ({
          row,
          frames: Array.from({ length: indexCount }, (_, frameIndex) => ({
            frameIndex,
            cues: getActiveVisualCueStack(row.screen, frameIndex),
          })),
        })),
    [rowModel.rows, getActiveVisualCueStack, indexCount]
  )

  const getVisibleLaneCount = (group: string) =>
    rowModel.rows.filter((row) => row.group === group).length

  const addVisualLayer = (screen: number) => {
    const group = `screen-${screen}`
    const nextCount = Math.min(
      DEFAULT_MAX_VISUAL_LAYERS,
      getVisibleLaneCount(group) + 1
    )
    ensureGroupExpanded(group)
    setMinimumGroupLanes((prev) => ({ ...prev, [group]: nextCount }))
  }

  const removeVisualLayer = async (screen: number, layer: number) => {
    const group = `screen-${screen}`
    const visibleCount = getVisibleLaneCount(group)
    const layerToRemove = Number(layer)

    if (!Number.isInteger(layerToRemove) || layerToRemove <= 0) return

    const { removedCueIds, shiftedCues } = planVisualLayerRemoval(
      cues,
      screen,
      layerToRemove
    )
    const nextCount = Math.max(1, visibleCount - 1)

    try {
      for (const cueId of removedCueIds) {
        await dispatch(removeCue(id, cueId))
      }

      const cuesToShift = [...shiftedCues].sort(
        (firstCue, secondCue) =>
          Number(firstCue.layer ?? 0) - Number(secondCue.layer ?? 0)
      )

      for (const cue of cuesToShift) {
        await dispatch(
          updatePresentation(
            id,
            {
              ...cue,
              cueName: cue.name,
              layer: cue.layer ?? 0,
            },
            cue._id
          )
        )
      }

      ensureGroupExpanded(group)
      setMinimumGroupLanes((prev) => ({ ...prev, [group]: nextCount }))
      showToast({
        title: "Layer removed",
        description: `Layer ${layerToRemove + 1} removed from screen ${screen}`,
        status: "success",
      })
    } catch (error) {
      console.error(error)
      await dispatch(fetchPresentationInfo(id))
      showToast({
        title: "Error",
        description: error.message || "Failed to remove layer",
        status: "error",
      })
    }
  }

  const addAudioTrack = () => {
    const nextCount = Math.min(
      DEFAULT_MAX_AUDIO_TRACKS,
      getVisibleLaneCount("audio") + 1
    )
    ensureGroupExpanded("audio")
    setMinimumGroupLanes((prev) => ({ ...prev, audio: nextCount }))
  }

  const cueRowOf = (cue: Cue) => rowModel.cueY[cue._id] ?? 0

  const laneScreenLayer = (yIndex: number) => {
    const lane = laneAt(rowModel.rows, yIndex)
    if (!lane) return { screen: 1, layer: 0 }
    const isAudio = lane.kind === "audio-track" || lane.kind === "audio"
    return {
      screen: isAudio ? getAudioRow(presentation.screenCount) : lane.screen,
      layer: lane.layer ?? 0,
    }
  }

  const rowLabelForCue = (cue: {
    cueType?: string
    screen?: number
    layer?: number
  }) =>
    cue.cueType === "audio"
      ? `audio track ${Number(cue.layer ?? 0) + 1}`
      : `screen ${cue.screen}, layer ${Number(cue.layer ?? 0) + 1}`

  const cueTypeForTarget = (screen: number, cueType?: string) =>
    cueType ||
    (Number(screen) === getAudioRow(presentation.screenCount)
      ? "audio"
      : "visual")

  const getRowCueConflict = (
    index: number,
    screen: number,
    layer: number,
    excludedCueId: string | null = null
  ) =>
    cues.find((cue) => {
      const samePosition =
        Number(cue.index) === Number(index) &&
        Number(cue.screen) === Number(screen) &&
        Number(cue.layer ?? 0) === Number(layer ?? 0)

      if (!samePosition) {
        return false
      }

      return !excludedCueId || cue._id !== excludedCueId
    })

  const isRowInsideGrid = (xIndex: number, yIndex: number) =>
    Number(xIndex) >= 0 &&
    Number(xIndex) < Number(indexCount) &&
    Number(yIndex) >= 0 &&
    Number(yIndex) < Number(rowModel.rowCount)

  const getCueEndIndex = (cue: Cue) =>
    Number(cue.index) + getCueVisualSpanFromMap(cue, cueVisualSpanMap) - 1

  const cueOccupiesSlot = (cue: Cue, xIndex: number, yIndex: number) =>
    cueRowOf(cue) === Number(yIndex) &&
    Number(xIndex) >= Number(cue.index) &&
    Number(xIndex) <= getCueEndIndex(cue)

  // Get cue at grid position (including ones spanning multiple cells)
  const getCueAtPosition = (xIndex: number, yIndex: number) =>
    gridCues.find((cue) => cueOccupiesSlot(cue, xIndex, yIndex))

  // Get cue at grid position (only anchor cell - first cell of the cue)
  const getAnchorCueAtPosition = (xIndex: number, yIndex: number) =>
    gridCues.find(
      (cue) =>
        Number(cue.index) === Number(xIndex) && cueRowOf(cue) === Number(yIndex)
    )

  const getContinuationPreviewSpanOverrides = (
    xIndex: number,
    yIndex: number,
    cueType?: string,
    draggedCueId?: string | null
  ) => {
    return getContinuationShrinkSpanOverrides({
      xIndex,
      yIndex,
      cueType,
      draggedCueId,
      isValidDropCell: laneAcceptsCueType(
        laneAt(rowModel.rows, yIndex),
        cueType as string
      ),
      getCueAtPosition,
    })
  }
  // Check if a cue exists at the given grid position
  const {
    hoverPreviewRef,
    dragCursorPreviewRef,
    dragPlacementPreviewRef,
    externalPlacementPreviewRef,
    externalCursorPreviewRef,
    externalCursorSurfaceRef,
    externalCursorImageRef,
    externalCursorLabelRef,
    hideHoverPreview,
    showHoverPreview,
    updateDragPreviewCell,
    hideDragPlacementPreview,
    cancelDragPreviewFrame,
    clearExternalPlacementPreview,
    primeDragPreviewFromEvent,
    scheduleDragPreviewFromEvent,
    scheduleExternalPreviewFromEvent,
    resetDragPointerTracking,
    setDragPlacementLockedToAnchor,
  } = useEditModeDragPreviewController({
    containerRef,
    columnWidth,
    rowHeight,
    headerRowHeight: frameHeaderHeight,
    gap,
    indexCount,
    rows: rowModel.rows,
    rowCount: rowModel.rowCount,
    cueRowIndex: rowModel.cueY,
    selectedCue,
    setDragCursorMode,
    clearExternalDragPreview,
    clearInternalDragSpanPreview,
    setExternalDragSpanOverridesIfChanged,
    setInternalDragSpanOverridesIfChanged,
    getContinuationPreviewSpanOverrides,
    dragPreviewValidBorder,
    dragPreviewInvalidBorder,
    dragPreviewValidBg,
    dragPreviewInvalidBg,
  })

  useEffect(() => {
    if (!isToolboxOpen) {
      setSelectedCue(null)
    }
  }, [isToolboxOpen])

  useEffect(() => {
    if (isDragging) {
      return
    }

    if (isCopied) {
      setDragCursorMode("copy")
      return
    }

    setDragCursorMode("default")
  }, [isCopied, isDragging])

  useEffect(() => {
    if (selectedCue && !cues.some((cue) => cue._id === selectedCue._id)) {
      setSelectedCue(null)
    }
  }, [cues, selectedCue])

  useEffect(() => {
    hideHoverPreview()
  }, [cues, indexCount, rowModel.rowCount, hideHoverPreview])

  useEffect(() => {
    const clearTransientPreviews = () => {
      clearExternalPlacementPreview()
      hideHoverPreview()
      mediaStore.clearActiveDragData()
    }

    window.addEventListener("drop", clearTransientPreviews)
    window.addEventListener("dragend", clearTransientPreviews)

    return () => {
      window.removeEventListener("drop", clearTransientPreviews)
      window.removeEventListener("dragend", clearTransientPreviews)
    }
  }, [clearExternalPlacementPreview, hideHoverPreview])

  const buildPoolCursorPreview = (dragData: NewCueDragData | null) => {
    if (!dragData || dragData.type !== "newCueFromForm") {
      return null
    }

    const cueName = (dragData.cueName || "").trim()

    if (dragData.elementType === "color") {
      return {
        name: cueName,
        color: dragData.color || "rgba(32,32,32,0.9)",
        imageUrl: "",
      }
    }

    if (dragData.elementType === "media") {
      const mimeType = dragData.mimeType || ""
      const isImagePreview =
        mimeType.startsWith("image/") && Boolean(dragData.previewUrl)

      return {
        name: cueName,
        color: "rgba(32,32,32,0.9)",
        imageUrl: isImagePreview ? dragData.previewUrl : "",
      }
    }

    if (dragData.elementType === "sound") {
      return {
        name: cueName,
        color: "rgba(32,32,32,0.9)",
        imageUrl: "",
      }
    }

    return null
  }
  // Handle case where trying to delete a frame that has existing cues - show confirmation and delete cues if confirmed
  const handleIndexHasData = async (index: number) => {
    setConfirmMessage(
      `Frame ${index} has existing elements. Deleting this frame will also delete all elements on this frame. Delete anyway?`
    )
    setConfirmAction(() => async () => {
      setIsConfirmOpen(false)

      // Remove all cues that are on the selected index
      const cuesOnIndex = cues.filter((c) => Number(c.index) === Number(index))
      for (const cue of cuesOnIndex) {
        try {
          await dispatch(removeCue(id, cue._id))
        } catch (err) {
          console.error("Failed to remove cue on index during confirm:", err)
        }
      }

      const movedCount = await shiftAndRemoveIndex(index)
      if (movedCount === null) return

      showToast({
        title: "Removed frame in between and its elements",
        description: `Removed old Frame ${index} and all its elements.${movedCount > 0 ? ` Moved ${movedCount} element(s) backwards.` : ""}`,
        status: "success",
      })
    })
    setIsConfirmOpen(true)
  }

  // Add a new frame at specified index - shifts existing cues to the right
  const handleAddIndex = async (index: number) => {
    const originalIndexCount = indexCount
    const cuesAfter = cues.filter((cue) => Number(cue.index) > Number(index))

    if (originalIndexCount < 101) {
      try {
        dispatch(incrementIndexCount())
        await dispatch(
          saveIndexCount({ id, indexCount: originalIndexCount + 1 })
        )

        if (cuesAfter.length > 0) {
          await dispatch(shiftPresentationIndexes(id, index, "right"))
        }

        if (cuesAfter.length > 0) {
          showToast({
            title: "Frame added in between",
            description: `Added a new frame after ${index === 0 ? "Starting Frame" : `Frame ${index}`}. Moved ${cuesAfter.length} element(s) forward.`,
            status: "success",
          })
        }
      } catch (error) {
        console.error("Error shifting cues when adding index:", error)
        dispatch(decrementIndexCount())
        await dispatch(saveIndexCount({ id, indexCount: originalIndexCount }))
        showToast({
          title: "Error",
          description: error.message || "Failed to add index",
          status: "error",
        })
      }
    }
  }

  // Remove frame at specified index - shifts existing cues to the left
  const handleRemoveIndex = async (index: number) => {
    if (indexCount <= 1) {
      showToast({
        title: "Minimum indexes required",
        description: "Cannot have less than 1 index",
        status: "warning",
      })
      return
    }

    const cuesOnIndex = cues.filter(
      (cue) => Number(cue.index) === Number(index)
    )
    if (cuesOnIndex.length > 0) {
      handleIndexHasData(index)
      return
    }

    const movedCount = await shiftAndRemoveIndex(index)
    if (movedCount === null) return

    // We never reach here if there were existing elements on the removed index, as handleIndexHasData handles that case (so different toast)
    if (movedCount > 0) {
      showToast({
        title: "Removed frame in between",
        description: `Removed old Frame ${index}. Moved ${movedCount} element(s) backwards.`,
        status: "success",
      })
    }
  }

  const performRemoveIndex = async (newIndexCount: number) => {
    if (indexCount > 1) {
      dispatch(decrementIndexCount())
      await dispatch(saveIndexCount({ id, indexCount: newIndexCount }))
    }
  }

  // Shared by handleRemoveIndex and handleIndexHasData: shifts cues after
  // `index` left by one (only if any exist), then shrinks the index count.
  // Returns null and shows an error toast if the shift fails, so callers can
  // skip their own success toast; otherwise returns how many cues moved.
  const shiftAndRemoveIndex = async (index: number) => {
    const cuesAfter = cues.filter((cue) => Number(cue.index) > Number(index))

    try {
      if (cuesAfter.length > 0) {
        await dispatch(shiftPresentationIndexes(id, index, "left"))
      }
      await performRemoveIndex(indexCount - 1)
      return cuesAfter.length
    } catch (error) {
      console.error("Error shifting cues when removing index:", error)
      showToast({
        title: "Error",
        description: error.message || "Failed to remove index",
        status: "error",
      })
      return null
    }
  }

  // Add a new screen - updates audio cue row numbers and creates initial element
  const handleIncreaseScreenCount = async () => {
    if ((presentation.screenCount ?? 0) >= 8) {
      showToast({
        title: "Maximum screens reached",
        description: "Cannot add more than 8 screens",
        status: "warning",
      })
      return
    }

    try {
      const newScreenNumber = (presentation.screenCount ?? 0) + 1

      dispatch(incrementScreenCount())
      await dispatch(saveScreenCount({ id, screenCount: newScreenNumber }))

      await dispatch(fetchPresentationInfo(id))

      const formData = createFormData(
        0,
        `initial element for screen ${newScreenNumber}`,
        newScreenNumber,
        null,
        undefined,
        undefined,
        false,
        0,
        1
      )

      await dispatch(createCue(id, formData))

      showToast({
        title: "Screen added",
        description: `Screen ${newScreenNumber} has been added with initial element`,
        status: "success",
      })
    } catch (error) {
      dispatch(decrementScreenCount()) // Revert on error
      showToast({
        title: "Error",
        description: error.message || "Failed to add screen",
        status: "error",
      })
    }
  }

  // Remove a screen - deletes all cues on that screen
  const handleDecreaseScreenCount = async () => {
    if ((presentation.screenCount ?? 0) <= 1) {
      showToast({
        title: "Minimum screens required",
        description: "Cannot have less than 1 screen",
        status: "warning",
      })
      return
    }

    const screenToRemove = presentation.screenCount
    const cuesOnScreen = visualCues.filter(
      (cue) => cue.screen === screenToRemove
    )

    if (cuesOnScreen.length > 0) {
      setConfirmMessage(
        `Screen ${screenToRemove} has existing elements. Deleting this screen will also delete all elements on this screen. Delete anyway?`
      )
      setConfirmAction(() => async () => {
        setIsConfirmOpen(false)
        await performScreenRemoval()
      })
      setIsConfirmOpen(true)
      return
    }

    await performScreenRemoval()
  }

  const performScreenRemoval = async () => {
    try {
      const currentScreenCount = presentation.screenCount

      dispatch(decrementScreenCount())
      const result = await dispatch(
        saveScreenCount({ id, screenCount: (currentScreenCount ?? 0) - 1 })
      )

      await dispatch(fetchPresentationInfo(id))

      // Show appropriate message based on whether cues were removed
      const removedCuesCount =
        (result.payload as { removedCuesCount?: number } | undefined)
          ?.removedCuesCount || 0
      if (removedCuesCount > 0) {
        showToast({
          title: "Screen removed",
          description: `Screen ${currentScreenCount} removed along with ${removedCuesCount} cue(s)`,
          status: "success",
        })
      } else {
        showToast({
          title: "Screen removed",
          description: `Screen ${currentScreenCount} has been removed`,
          status: "success",
        })
      }
    } catch (error) {
      dispatch(incrementScreenCount()) // Revert on error
      showToast({
        title: "Error",
        description: error.message || "Failed to remove screen",
        status: "error",
      })
    }
  }

  // Handle mouse down - select cue and start drag if clicking on grid item
  const handleMouseDown = (event: ReactMouseEvent) => {
    if (event.button !== 0) {
      return
    }

    if (isCopied) {
      return
    }

    if (
      targetElement(event).closest(
        "button, [role='menuitem'], input, textarea, select, a"
      )
    ) {
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )
    if (cueExists(xIndex, yIndex)) {
      // cueExists() on the line above is the same lookup.
      const movingCue = getCueAtPosition(xIndex, yIndex) as Cue
      setSelectedCue(movingCue)
      updateDragPreviewCell({
        xIndex: Number(movingCue.index),
        yIndex: cueRowOf(movingCue),
      })

      if (targetElement(event).closest(".react-grid-item")) {
        event.preventDefault()
        setIsDragging(true)
        setDragCursorMode("grabbing")
        setDragPlacementLockedToAnchor(true)
        dragStartPointerRef.current = {
          clientX: event.clientX,
          clientY: event.clientY,
        }
        dragHasMovedRef.current = false
        hideHoverPreview()
        primeDragPreviewFromEvent(event)
      } else {
        setIsDragging(false)
        setDragCursorMode("default")
        setDragPlacementLockedToAnchor(false)
        dragStartPointerRef.current = null
        dragHasMovedRef.current = false
        updateDragPreviewCell(null)
        clearInternalDragSpanPreview()
        resetDragPointerTracking()
        hideDragPlacementPreview()
        cancelDragPreviewFrame()
      }
    }
  }

  // Handle pasting copied cue - validates drop location and creates new cue
  const handlePaste = async (event: ReactMouseEvent) => {
    if (targetElement(event).closest("button")) return
    if (!isCopied || !copiedCue) return

    if (targetElement(event).closest(".x-index-label")) {
      clearExternalPlacementPreview()
      setDragCursorMode("default")
      setIsCopied(false)
      setCopiedCue(null)
      setShowAlert(false)
      setAlertData({})
      showToast({
        title: "Cancelled copying",
        description: "Copying has been cancelled.",
        status: "info",
      })
      return
    }

    if (!containerRef?.current) {
      console.error("Container ref is not available")
      return
    }
    // Get grid position from mouse event
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )
    // Validate drop position - must be within grid, compatible with cue type, and not the same cell as the original cue
    const hoveredCue = getCueAtPosition(xIndex, yIndex)
    const isBlockedCell = Boolean(
      hoveredCue && hoveredCue._id === copiedCue._id
    )
    const isInsideGrid = isRowInsideGrid(xIndex, yIndex)
    const isValidDropCell =
      laneAcceptsCueType(laneAt(rowModel.rows, yIndex), copiedCue.cueType) &&
      !isBlockedCell

    if (!isInsideGrid) {
      clearExternalPlacementPreview()
      setDragCursorMode("default")
      setIsCopied(false)
      setCopiedCue(null)
      setShowAlert(false)
      setAlertData({})
      showToast({
        title: "Cancelled copying",
        description: "Copying has been cancelled.",
        status: "info",
      })
      return
    }

    if (isBlockedCell) {
      return
    }

    if (!isValidDropCell) {
      showToast({
        title: "Only audio files on the audio row.",
        description: "Click on an appropriate row to paste the element.",
        status: "error",
      })
      return
    }

    const newCueData = await createNewCueData(xIndex, yIndex, copiedCue)
    await addCue(newCueData)
  }

  const updateCopiedCuePreview = (event: ReactMouseEvent) => {
    scheduleExternalPreviewFromEvent(event, {
      cueType: copiedCue?.cueType,
      draggedCueId: copiedCue?._id,
      idleCursor: "copy",
      isHeaderCell: Boolean(targetElement(event).closest(".x-index-label")),
      isBlockedCell: (xIndex: number, yIndex: number) => {
        const hoveredCue = getCueAtPosition(xIndex, yIndex)
        return Boolean(hoveredCue && hoveredCue._id === copiedCue?._id)
      },
    })
  }

  // Create new cue data from copied cue - fetches file if needed and appends " copy" to name
  const createNewCueData = async (
    xIndex: number,
    yIndex: number,
    copiedCue: Cue
  ) => {
    let fileObj = null
    if (copiedCue.file) {
      fileObj = await fetchFileFromUrl(
        copiedCue.file.url as string,
        copiedCue.file.name as string
      )
      if (copiedCue.file.driveId) {
        fileObj.driveId = copiedCue.file.driveId
      }
    }

    return {
      index: xIndex,
      cueName: `${copiedCue.name} copy`,
      ...laneScreenLayer(yIndex),
      file: fileObj,
      fileName: copiedCue.file?.name || null,
      color: copiedCue.color,
      loop: copiedCue.loop,
      continuePlayback: Boolean(copiedCue.continuePlayback),
      opacity: normalizeCueOpacity(copiedCue.opacity),
    }
  }
  // Fetch file object from URL - used for copying cues with files
  const resetDragInteraction = ({ clearSpanPreview = true } = {}) => {
    setIsDragging(false)
    setDragCursorMode("default")
    setDragPlacementLockedToAnchor(false)
    dragStartPointerRef.current = null
    dragHasMovedRef.current = false
    updateDragPreviewCell(null)
    if (clearSpanPreview) {
      clearInternalDragSpanPreview()
    }
    hideDragPlacementPreview()
    cancelDragPreviewFrame()
    resetDragPointerTracking()
  }

  const renderCollapsedPreviewMedia = (cue: Cue) => {
    const mediaUrl =
      cue.file?.url || (cue.file?.name ? `/${cue.file.name}` : "")
    const mediaType = cue.file?.type || cue.file?.mimeType || ""

    if (mediaUrl && mediaType.startsWith("video/")) {
      return (
        <Box
          as="video"
          src={mediaUrl}
          width="100%"
          height="100%"
          objectFit="cover"
          muted
          playsInline
        />
      )
    }

    if (mediaUrl && mediaType.startsWith("image/")) {
      return (
        <Box
          as="img"
          src={mediaUrl}
          alt={cue.name || ""}
          width="100%"
          height="100%"
          objectFit="cover"
        />
      )
    }

    return <Box width="100%" height="100%" bg={cue.color || "#111111"} />
  }

  // Handle mouse move - show hover previews and update drag preview position
  const handleMouseMove = (event: ReactMouseEvent) => {
    if (isDragging) {
      if (!dragHasMovedRef.current && dragStartPointerRef.current) {
        const deltaX = event.clientX - dragStartPointerRef.current.clientX
        const deltaY = event.clientY - dragStartPointerRef.current.clientY
        if (Math.hypot(deltaX, deltaY) >= dragCommitDistancePx) {
          dragHasMovedRef.current = true
          setDragPlacementLockedToAnchor(false)
        }
      }

      scheduleDragPreviewFromEvent(event)

      hideHoverPreview()
      return
    }

    if (isCopied && copiedCue) {
      hideHoverPreview()
      updateCopiedCuePreview(event)
      return
    }

    if (targetElement(event).closest(".x-index-label")) {
      hideHoverPreview()
      return
    }
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    const cueExists = Boolean(getCueAtPosition(xIndex, yIndex))

    if (
      !cueExists &&
      xIndex >= 0 &&
      xIndex < indexCount &&
      yIndex >= 0 &&
      yIndex < rowModel.rowCount
    ) {
      showHoverPreview(xIndex, yIndex)
    } else {
      hideHoverPreview()
    }
  }

  useEffect(() => {
    if (wasCopiedRef.current && !isCopied) {
      clearExternalPlacementPreview()
    }

    wasCopiedRef.current = isCopied
  }, [clearExternalPlacementPreview, isCopied])

  // Handle mouse up - drop cue if dragged, handle double-click otherwise
  const handleMouseUp = async (event: ReactMouseEvent) => {
    const wasDragging = isDragging
    const dragStartPointer = dragStartPointerRef.current
    const didDragMove = Boolean(
      dragHasMovedRef.current ||
      (dragStartPointer &&
        Math.hypot(
          event.clientX - dragStartPointer.clientX,
          event.clientY - dragStartPointer.clientY
        ) >= dragCommitDistancePx)
    )
    resetDragInteraction({ clearSpanPreview: !wasDragging })
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (wasDragging && selectedCue) {
      if (!didDragMove) {
        // Pointer went down on a cue and came up without crossing the 4px drag
        // threshold: that is a click, so it focuses the lane.
        commitLaneFocusFromEvent(event)
        clearInternalDragSpanPreview()
        return
      }

      const targetCue = getAnchorCueAtPosition(xIndex, yIndex)
      if (targetCue && selectedCue !== targetCue) {
        await handleElementPositionChange(selectedCue, targetCue)
        clearInternalDragSpanPreview()
        return
      }

      const moveToSamePosition =
        Number(selectedCue.index) === Number(xIndex) &&
        cueRowOf(selectedCue) === Number(yIndex)

      if (moveToSamePosition) {
        clearInternalDragSpanPreview()
        return
      }

      const isInsideGrid = isRowInsideGrid(xIndex, yIndex)
      const isValidDropCell = laneAcceptsCueType(
        laneAt(rowModel.rows, yIndex),
        selectedCue.cueType
      )

      if (!isInsideGrid) {
        clearInternalDragSpanPreview()
        return
      }

      if (!isValidDropCell) {
        showToast({
          title: "Cannot move this file type here",
          description:
            "Keep audio elements to the audio row and visual elements to the visual rows.",
          status: "error",
        })
        clearInternalDragSpanPreview()
        return
      }

      const target = laneScreenLayer(yIndex)
      const movedCue = {
        ...selectedCue,
        index: xIndex,
        cueName: selectedCue.name,
        screen: target.screen,
        layer: target.layer,
      }

      setSelectedCue(null)
      await dispatchUpdateCue(selectedCue._id, movedCue)
      clearInternalDragSpanPreview()
      return
    }

    if (wasDragging) {
      clearInternalDragSpanPreview()
      return
    }

    if (!wasDragging) {
      if (
        targetElement(event).closest(
          "button, [role='menuitem'], input, textarea, select, a"
        )
      ) {
        return
      }

      // Skipped while copying: the same gesture is a paste, and handlePaste
      // runs on the click that follows this mouseup. Frame headers are excluded
      // because their overhanging buttons reach into row space.
      if (!isCopied && !targetElement(event).closest(".x-index-label")) {
        commitLaneFocusFromEvent(event)
      }

      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
        clickTimeout.current = null
        handleDoubleClick(event)
      } else {
        clickTimeout.current = setTimeout(() => {
          clickTimeout.current = null
        }, 300)
      }
    }
  }

  // Handle drag over grid - show preview of where element will be placed
  const handleGridDragOver = (event: ReactDragEvent) => {
    event.preventDefault()
    hideHoverPreview()

    if (!containerRef.current) {
      clearExternalPlacementPreview()
      return
    }

    const dragData = getDragDataFromDataTransfer(event.dataTransfer)
    latestGridDragDataRef.current = dragData
    latestGridDragCellRef.current = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )
    const dragCueType = getCueTypeFromDragData(dragData)
    if (!dragCueType) {
      clearExternalPlacementPreview()
      return
    }

    scheduleExternalPreviewFromEvent(event, {
      cueType: dragCueType,
      idleCursor: "copy",
      isHeaderCell: Boolean(targetElement(event).closest(".x-index-label")),
      cursorPreview: buildPoolCursorPreview(dragData),
      enableContinuationPreview: false,
    })
  }

  // Handle drag leave grid - clear preview when leaving grid boundary
  const handleGridDragLeave = (event: ReactDragEvent) => {
    const gridRect = event.currentTarget.getBoundingClientRect()
    const pointerInsideGrid =
      event.clientX >= gridRect.left &&
      event.clientX <= gridRect.right &&
      event.clientY >= gridRect.top &&
      event.clientY <= gridRect.bottom

    if (!pointerInsideGrid) {
      latestGridDragDataRef.current = null
      latestGridDragCellRef.current = null
      clearExternalPlacementPreview()
    }
  }

  // Compute grid layout from cues - determines cue position and size on grid
  const layout = gridCues.map((cue) => ({
    i: cue._id.toString(),
    x: cue.index,
    y: cueRowOf(cue),
    w: getCueVisualSpanFromMap(cue, cueVisualSpanMap),
    h: 1,
    static: false,
  }))

  // Add a new cue - checks for conflicts and saves to backend
  const addCue = async (cueData: CueUpdateInput) => {
    const {
      index,
      cueName,
      screen,
      layer = 0,
      file,
      loop,
      continuePlayback = false,
      color,
      opacity = 1,
    } = cueData

    //Check if cue with same index and screen already exists
    const existingCue = getRowCueConflict(index, screen, layer)

    if (existingCue) {
      await handleCueExists(existingCue, cueData)
      return
    }

    const formData = createFormData(
      index,
      cueName,
      screen,
      file || undefined,
      undefined,
      color,
      loop || false,
      layer,
      normalizeCueOpacity(opacity),
      continuePlayback
    )

    try {
      await dispatch(createCue(id, formData))

      setTimeout(() => {
        showToast({
          title: "Element added",
          description: `Element ${cueName} added to ${rowLabelForCue({
            cueType: cueTypeForTarget(screen, cueData.cueType),
            screen,
            layer,
          })}`,
          status: "success",
        })
      }, 300)
    } catch (error) {
      const errorMessage = error.message
      showToast({ title: "Error", description: errorMessage, status: "error" })
    }
  }

  const handleCueExists = async (
    existingCue: Cue,
    newCueData: CueUpdateInput
  ) => {
    setConfirmMessage(
      `Frame ${newCueData.index} element already exists on ${rowLabelForCue(newCueData)}. Do you want to replace it?`
    )
    setConfirmAction(() => async () => {
      const updatedCueData = {
        ...newCueData,
        _id: existingCue._id,
        cueName: newCueData.cueName,
      }

      await dispatchUpdateCue(existingCue._id, updatedCueData)
      setIsConfirmOpen(false)
    })
    setIsConfirmOpen(true)
  }

  const fetchFileFromUrl = async (
    url: string,
    fileName: string
  ): Promise<CueUploadFile> => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type })
  }

  // Update existing cue - checks for conflicts with other cues at same position
  const updateCue = async (
    previousCueId: string,
    updatedCue: CueUpdateInput
  ) => {
    const previousStillExists = cues.some((cue) => cue._id === previousCueId)
    if (!previousStillExists) {
      await addCue(updatedCue)
      return
    }

    const existingCue = getRowCueConflict(
      updatedCue.index,
      updatedCue.screen,
      updatedCue.layer ?? 0,
      previousCueId
    )

    if (existingCue && existingCue._id !== previousCueId) {
      await handleExistingCueUpdate(existingCue, updatedCue, previousCueId)
      return
    }
    await dispatchUpdateCue(previousCueId, updatedCue)
  }

  const handleExistingCueUpdate = async (
    existingCue: Cue,
    updatedCue: CueUpdateInput,
    previousCueId: string
  ) => {
    setConfirmMessage(
      `${updatedCue.index} element already exists on ${rowLabelForCue(updatedCue)}. Do you want to replace it?`
    )

    setConfirmAction(() => async () => {
      try {
        const updatedCueData = await createUpdatedCueData(
          existingCue,
          updatedCue
        )
        await dispatch(removeCue(id, previousCueId))
        await dispatchUpdateCue(existingCue._id, updatedCueData)
      } catch (error) {
        console.error(error)
        showToast({
          title: "Error",
          description: error.message || "Failed to update element",
          status: "error",
        })
      }
      setIsConfirmOpen(false)
    })
    setIsConfirmOpen(true)
  }

  const createUpdatedCueData = async (
    existingCue: Cue,
    updatedCue: CueUpdateInput
  ) => {
    let fileObj = null
    if (updatedCue.file) {
      fileObj = await fetchFileFromUrl(
        (updatedCue.file as CueFileMeta).url as string,
        updatedCue.file.name as string
      )
    }

    // TODO(ts): BUG -- this reads updatedCue.file outside the guard above, so a
    // cue whose file is null throws here, as does the assignment when fileObj
    // was never created. Asserting preserves that exactly; moving the block
    // inside the guard would be a behaviour change no test covers.
    if ((updatedCue.file as CueFileMeta)!.driveId) {
      fileObj!.driveId = (updatedCue.file as CueFileMeta)!.driveId
    }

    return {
      ...existingCue,
      index: updatedCue.index,
      cueName: updatedCue.cueName,
      screen: updatedCue.screen,
      layer: updatedCue.layer ?? existingCue.layer ?? 0,
      opacity: normalizeCueOpacity(updatedCue.opacity ?? existingCue.opacity),
      file: fileObj,
      fileName: updatedCue.fileName,
    }
  }

  // Check if cue exists at grid position
  const cueExists = (xIndex: number, yIndex: number) => {
    return Boolean(getCueAtPosition(xIndex, yIndex))
  }

  // Check if anchor cue (first cell) exists at grid position
  const anchorCueExists = (xIndex: number, yIndex: number) => {
    return Boolean(getAnchorCueAtPosition(xIndex, yIndex))
  }

  const handleDoubleClick = (event: ReactMouseEvent) => {
    if (targetElement(event).closest(".x-index-label")) {
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (!isRowInsideGrid(xIndex, yIndex)) {
      return
    }

    const cue = getCueAtPosition(xIndex, yIndex)

    if (cue) {
      const lane = laneAt(rowModel.rows, yIndex)
      if (lane) onFocusLane(laneKey(lane))
      setSelectedCue(cue)
      setIsToolboxOpen(true)
    }
  }
  // Dispatch cue update to backend - used for moving cues and updating from toolbox
  const dispatchUpdateCue = async (
    cueId: string,
    updatedCue: CueUpdateInput
  ) => {
    try {
      await dispatch(updatePresentation(id, updatedCue, cueId))
      setTimeout(() => {
        showToast({
          title: "Element updated",
          description: `Element ${updatedCue.cueName} updated on screen ${updatedCue.screen}`,
          status: "success",
        })
      }, 300)
    } catch (error) {
      console.error(error)
      showToast({
        title: "Error",
        description: error.message || "An error occurred",
        status: "error",
      })
    }
  }

  const handleToolboxSave = async (updatedCue: CueUpdateInput) => {
    if (!selectedCue) {
      return
    }

    await dispatchUpdateCue(selectedCue._id, updatedCue)
    setSelectedCue(null)
    setIsToolboxOpen(false)
  }

  // Swap two cues positions - handles element reordering on grid
  const dispatchSwapCues = async (newTargetCue: Cue, newSelectedCue: Cue) => {
    try {
      await dispatch(swapCues(id, newTargetCue, newSelectedCue))
    } catch (error) {
      console.error(error)
      showToast({
        title: "Error",
        description: error.message || "An error occurred",
        status: "error",
      })
    }
  }

  // Calculate grid cell position from mouse coordinates
  const getPosition = (
    event: { clientX: number; clientY: number },
    containerRef: RefObject<HTMLDivElement | null>,
    columnWidth: number,
    rowHeight: number,
    gap: number
  ) => {
    const dropX = event.clientX
    // Every caller is a handler bound to this very container.
    const containerRect = containerRef.current!.getBoundingClientRect()
    const containerScrollLeft = containerRef.current!.scrollLeft

    const relativeDropX = dropX - containerRect.left
    const absoluteDropX = relativeDropX + containerScrollLeft
    const dropY = event.clientY - containerRect.top
    const rowsTopOffset = timelineRowsTopOffset()

    const cellWidthWithGap = columnWidth + gap
    const cellHeightWithGap = rowHeight + gap

    const yIndex = Math.floor((dropY - rowsTopOffset) / cellHeightWithGap)
    const xIndex = Math.floor(absoluteDropX / cellWidthWithGap)

    return { xIndex, yIndex }
  }

  // Handle swapping elements when dragging one to another's position
  const handleElementPositionChange = async (
    selectedCue: Cue,
    targetCue: Cue
  ) => {
    const newTargetCue = {
      ...targetCue,
      index: selectedCue.index,
      screen: selectedCue.screen,
      layer: selectedCue.layer ?? 0,
    }
    // We need to create new objects to avoid mutating state directly when swapping
    const newSelectedCue = {
      ...selectedCue,
      index: targetCue.index,
      screen: targetCue.screen,
      layer: targetCue.layer ?? 0,
    }
    // If either cue is audio, both must be audio - prevent swapping audio with visual elements
    const hasAudioCue =
      newTargetCue.cueType === "audio" || newSelectedCue.cueType === "audio"

    if (hasAudioCue) {
      if (!(
        newTargetCue.cueType === "audio" && newSelectedCue.cueType === "audio"
      )) {
        showToast({
          title: "Error",
          description: "You cannot swap elements with audio files",
          status: "error",
        })
        setSelectedCue(null)
        return
      } else {
        await dispatchSwapCues(newTargetCue, newSelectedCue)
        setSelectedCue(null)
      }
    } else {
      await dispatchSwapCues(newTargetCue, newSelectedCue)
      setSelectedCue(null)
    }
  }
  // Handle replacing existing cue when dropping new element on occupied cell
  const handleCueReplace = async (
    xIndex: number,
    yIndex: number,
    file: CueUploadFile
  ) => {
    const existingCue = getCueAtPosition(xIndex, yIndex)
    if (!existingCue) return
    const target = laneScreenLayer(yIndex)

    const updatedCue = {
      ...existingCue,
      index: xIndex,
      cueName: file.name,
      screen: target.screen,
      layer: target.layer,
      file: file,
      opacity: normalizeCueOpacity(existingCue.opacity),
    }

    await dispatchUpdateCue(existingCue._id, updatedCue)
    setIsConfirmOpen(false)
  }

  // Handle dropping elements on grid - creates new cues or replaces existing ones
  const handleDrop = async (event: ReactDragEvent) => {
    event.preventDefault()
    clearExternalPlacementPreview()

    let dragData = null
    try {
      const dataStr = event.dataTransfer.getData("application/json")
      if (dataStr) dragData = JSON.parse(dataStr)
    } catch (e) {
      // ignore parsing error
    }
    dragData = dragData || latestGridDragDataRef.current
    latestGridDragDataRef.current = null

    const files = Array.from(event.dataTransfer.files)
    const mediaFiles = files.filter(
      (file) =>
        isImageOrVideoMimeType(file?.type) || isAudioMimeType(file?.type)
    )

    if (mediaFiles.length === 0 && !dragData) {
      return
    }

    const dropCell = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )
    const fallbackDropCell = latestGridDragCellRef.current
    // The fallback yields undefined when no cell was cached. NaN behaves
    // identically in every comparison below and satisfies the number signature.
    const xIndex = Number.isFinite(dropCell.xIndex)
      ? dropCell.xIndex
      : (fallbackDropCell?.xIndex ?? NaN)
    const yIndex = Number.isFinite(dropCell.yIndex)
      ? dropCell.yIndex
      : (fallbackDropCell?.yIndex ?? NaN)
    latestGridDragCellRef.current = null

    if (dragData && dragData.type === "newCueFromForm") {
      const colorCueName = (dragData.cueName || "").trim()
      const targetLane = laneAt(rowModel.rows, yIndex)
      const target = laneScreenLayer(yIndex)

      // Handle different element types from the three boxes
      if (dragData.elementType === "color") {
        if (
          !isRowInsideGrid(xIndex, yIndex) ||
          !laneAcceptsCueType(targetLane, "visual")
        ) {
          showToast({
            title: "Only images/videos on screen rows",
            description: "Drag visual elements to screen rows.",
            status: "error",
          })
          return
        }

        // Color element - no file
        const dataToSave = {
          index: xIndex,
          cueName: colorCueName,
          screen: target.screen,
          layer: target.layer,
          file: null,
          color: dragData.color,
          opacity: normalizeCueOpacity(dragData.opacity),
        }

        await addCue(dataToSave)
        return
      } else if (
        dragData.elementType === "media" ||
        dragData.elementType === "sound"
      ) {
        // Media or sound element - has a file
        const isSound = dragData.elementType === "sound"
        const fileId = isSound ? dragData.soundId : dragData.mediaId
        const cueType = isSound ? "audio" : "visual"

        // Retrieve the file from mediaStore
        const file = mediaStore.getFile(fileId)

        if (!file) {
          showToast({
            title: "File not found",
            description:
              "The file could not be found. Please try uploading again.",
            status: "error",
          })
          return
        }

        // Validate screen placement
        if (
          !isRowInsideGrid(xIndex, yIndex) ||
          !laneAcceptsCueType(targetLane, cueType)
        ) {
          showToast({
            title: isSound
              ? "Only audio on audio rows"
              : "Only images/videos on screen rows",
            description: isSound
              ? "Drag audio files to an audio track."
              : "Drag media to screen rows, not audio tracks.",
            status: "error",
          })
          return
        }

        // Create cue with the actual file
        const dataToSave = {
          index: xIndex,
          cueName: dragData.cueName,
          screen: target.screen,
          layer: target.layer,
          file: file,
          opacity: 1,
        }

        await addCue(dataToSave)

        // Clean up the file from store after successful creation
        mediaStore.removeFile(fileId)
        return
      }

      // Default color-based element (legacy support)
      const dataToSave = {
        index: xIndex,
        cueName: colorCueName,
        screen: target.screen,
        layer: target.layer,
        file: null,
        color: dragData.color,
        opacity: normalizeCueOpacity(dragData.opacity),
      }

      await addCue(dataToSave)
      return
    }

    const file = mediaFiles[0]
    const fileCueType = isAudioMimeType(file?.type) ? "audio" : "visual"
    const targetLane = laneAt(rowModel.rows, yIndex)
    const target = laneScreenLayer(yIndex)

    if (
      isImageOrVideoMimeType(file?.type) &&
      xIndex < indexCount &&
      (!isRowInsideGrid(xIndex, yIndex) ||
        !laneAcceptsCueType(targetLane, "visual"))
    ) {
      showToast({
        title: "Only images/videos on screen rows.",
        description: "Click on an appropriate row to paste the element.",
        status: "error",
      })
      return
    }
    if (
      isAudioMimeType(file?.type) &&
      xIndex < indexCount &&
      (!isRowInsideGrid(xIndex, yIndex) ||
        !laneAcceptsCueType(targetLane, "audio"))
    ) {
      showToast({
        title: "Only audio files on audio tracks.",
        description: "Click on an appropriate row to paste the element.",
        status: "error",
      })
      return
    }

    if (anchorCueExists(xIndex, yIndex)) {
      setConfirmMessage(
        `Index ${xIndex} element already exists on ${rowLabelForCue({ cueType: fileCueType, ...target })}. Do you want to replace it?`
      )
      setConfirmAction(() => async () => {
        handleCueReplace(xIndex, yIndex, file)
      })
      setIsConfirmOpen(true)
      return
    }
    const formData = createFormData(
      xIndex,
      file.name,
      target.screen,
      file,
      undefined,
      undefined,
      false,
      target.layer,
      1
    )

    try {
      await dispatch(createCue(id, formData))
      showToast({
        title: "Element added",
        description: `Element ${file.name} added to ${rowLabelForCue({ cueType: fileCueType, ...target })}`,
        status: "success",
      })
    } catch (error) {
      const errorMessage = error.message || "An error occurred"
      showToast({
        title: "Error",
        description: errorMessage,
        status: "error",
      })
    }
  }

  headerActionsRef.current = {
    addIndex: handleAddIndex,
    removeIndex: handleRemoveIndex,
    increaseScreenCount: handleIncreaseScreenCount,
    decreaseScreenCount: handleDecreaseScreenCount,
    toggleAudioMute,
  }
  // Render the grid layout with headers and cues, and handle drag-and-drop interactions
  return (
    <>
      <CustomAlert showAlert={showAlert} alertData={alertData} />
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        data-testid="drop-area"
        style={{
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          display="flex"
          width="100%"
          marginTop="0px"
          height="100%"
          minHeight={0}
          overflow="visible"
        >
          <Box
            className="screen-boxes"
            display="grid"
            gridTemplateRows={`${frameHeaderHeight}px repeat(${rowModel.rowCount}, ${rowHeight}px)`}
            gap={`${gap}px`}
            // Sticky, so the per-screen group containers stay readable when the
            // timeline is scrolled sideways. zIndex was already 2 but inert:
            // the element was statically positioned.
            position="sticky"
            left={0}
            zIndex={5}
            bg={timelineSurface}
            flexShrink={0}
          >
            <Box h={`${frameHeaderHeight}px`} bg="transparent" />

            <RowHeaders
              rows={rowModel.rows}
              focusedRowIndex={focusedRowIndex}
              collapsedGroups={collapsedGroups}
              onToggleGroupCollapsed={toggleGroupCollapsed}
              onAddVisualLayer={addVisualLayer}
              onRemoveVisualLayer={removeVisualLayer}
              onAddAudioTrack={addAudioTrack}
              maxVisualLayers={DEFAULT_MAX_VISUAL_LAYERS}
              maxAudioTracks={DEFAULT_MAX_AUDIO_TRACKS}
              gap={gap}
              rowHeight={rowHeight}
              screenCount={presentation.screenCount as number}
              isAudioMuted={isAudioMuted}
              screenIcon={screenIcon}
              headerActionsRef={headerActionsRef}
            />
          </Box>
          <Box
            position="relative"
            pointerEvents="auto"
            minHeight={0}
            sx={{
              ".layout > .react-grid-placeholder": {
                background: bgColorHover,
                borderRadius: "16px",
                opacity: 1,
                transitionDuration: "0s",
              },
              ".layout .react-grid-item, .layout .react-grid-item *": {
                userSelect: "none",
                WebkitUserSelect: "none",
              },
              ".layout .react-grid-item img, .layout .react-grid-item video": {
                WebkitUserDrag: "none",
              },
            }}
          >
            <Box
              height={`${timelineRowsTopOffset() + laneSpanHeight(rowModel.rowCount)}px`}
              minHeight="100%"
              width="100%"
              position="relative"
              cursor={isDragging || isCopied ? dragCursorMode : "default"}
              // id="presentations-grid"
              data-testid="edit-mode-grid-container"
              ref={containerRef}
              onDoubleClick={handleDoubleClick}
              onMouseDownCapture={handleMouseDown}
              onMouseMove={handleMouseMove}
              onDragOver={handleGridDragOver}
              onDragLeave={handleGridDragLeave}
              onDragStart={(event) => {
                if (targetElement(event).closest(".react-grid-item")) {
                  event.preventDefault()
                }
              }}
              onMouseLeave={() => {
                hideHoverPreview()

                if (isDragging) {
                  resetDragInteraction()
                  return
                }

                if (isCopied) {
                  clearExternalPlacementPreview()
                  setDragCursorMode("copy")
                }

                updateDragPreviewCell(null)
                clearInternalDragSpanPreview()
                hideDragPlacementPreview()
                if (!isCopied) {
                  setDragCursorMode("default")
                }
              }}
              onMouseUp={handleMouseUp}
              onClick={handlePaste}
            >
              <Box
                className="index-boxes"
                display="grid"
                gridTemplateColumns={`repeat(${xLabels.length}, ${columnWidth}px)`}
                gap={`${gap}px`}
                position="sticky"
                top={0}
                zIndex={6}
                bg={timelineSurface}
                mb={`${gap}px`}
              >
                <ColumnHeaders
                  xLabels={xLabels}
                  cueIndex={cueIndex}
                  bgCurrentFrame={bgCurrentFrame}
                  bgColorIndex={bgColorIndex}
                  activeFrameBorderColor={activeFrameBorderColor}
                  inactiveFrameBorderColor={inactiveFrameBorderColor}
                  rowHeight={rowHeight}
                  columnWidth={columnWidth}
                  frameHeaderHeight={frameHeaderHeight}
                  indexCount={indexCount}
                  headerActionsRef={headerActionsRef}
                />
              </Box>
              {audioStartRow > 0 && (
                <Box
                  data-testid="audio-section-divider"
                  position="absolute"
                  left={0}
                  right={0}
                  top={`${laneTop(audioStartRow) - gap / 2}px`}
                  height="1px"
                  bg="#2f6b5f"
                  opacity={0.7}
                  pointerEvents="none"
                  zIndex={3}
                />
              )}
              <Box
                pointerEvents={isDragging ? "none" : "auto"}
                id="presentations-grid"
              >
                <GridLayoutComponent
                  layout={layout}
                  cues={gridCues}
                  cueRowIndex={rowModel.cueY}
                  focusedRowIndex={focusedRowIndex}
                  rowCount={rowModel.rowCount}
                  containerRef={containerRef}
                  columnWidth={columnWidth}
                  rowHeight={rowHeight}
                  gap={gap}
                  setIsCopied={setIsCopied}
                  setCopiedCue={setCopiedCue}
                  id={id}
                  cueIndex={cueIndex}
                  isAudioMuted={isAudioMuted}
                  setSelectedCue={setSelectedCue}
                  setIsToolboxOpen={setIsToolboxOpen}
                  indexCount={indexCount}
                  setShowAlert={setShowAlert}
                  setAlertData={setAlertData}
                  screenCount={presentation.screenCount as number}
                  isDragging={isDragging}
                  draggingCueId={
                    isDragging && selectedCue ? selectedCue._id : null
                  }
                  previewCueSpanOverrides={previewCueSpanOverrides}
                  isCopied={isCopied}
                  interactionCursor={
                    !isDragging && isCopied ? dragCursorMode : null
                  }
                />
              </Box>

              {collapsedVisualRowPreviews.map(({ row, frames }) =>
                frames.map(({ frameIndex, cues: frameCues }) => (
                  <Box
                    key={`${row.group}-collapsed-preview-${frameIndex}`}
                    data-testid={`collapsed-preview-${row.group}-${frameIndex}`}
                    position="absolute"
                    left={`${columnLeft(frameIndex)}px`}
                    top={`${laneTop(row.y)}px`}
                    width={`${columnWidth}px`}
                    height={`${rowHeight}px`}
                    borderRadius="10px"
                    overflow="hidden"
                    bg="rgba(255, 255, 255, 0.06)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    pointerEvents="none"
                    zIndex={0}
                  >
                    {frameCues.map((cue, stackIndex) => (
                      <Box
                        key={`${cue._id}-${stackIndex}`}
                        position="absolute"
                        inset="0"
                        opacity={normalizeCueOpacity(cue.opacity)}
                        zIndex={100 - Number(cue.layer ?? 0)}
                      >
                        {renderCollapsedPreviewMedia(cue)}
                      </Box>
                    ))}
                    {frameCues.length > 0 && (
                      <Text
                        position="absolute"
                        left="8px"
                        bottom="6px"
                        maxWidth={`${Math.max(columnWidth - 16, 40)}px`}
                        color="white"
                        fontSize="12px"
                        fontWeight="700"
                        lineHeight="1.1"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        textShadow="1px 1px 3px rgba(0,0,0,0.85)"
                        zIndex={130}
                      >
                        {frameCues[frameCues.length - 1].name}
                      </Text>
                    )}
                  </Box>
                ))
              )}

              {!isDragging && (
                // Show placement preview for copied cue when not dragging - follows cursor and shows where the cue would be placed if clicked
                <Box
                  data-testid={
                    isCopied
                      ? "copy-drag-placement-preview"
                      : "pool-drag-placement-preview"
                  }
                  ref={externalPlacementPreviewRef}
                  data-valid-drop-cell="false"
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform="translate3d(0, 0, 0)"
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px dashed"
                  borderColor={dragPreviewInvalidBorder}
                  bg={dragPreviewInvalidBg}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.16)"
                  pointerEvents="none"
                  zIndex={20}
                  display="none"
                  style={{ willChange: "transform" }}
                />
              )}

              {!isDragging && !isCopied && (
                // Show cursor preview for pool element being dragged - shows a preview of the actual element being dragged from the pool following the cursor
                <Box
                  data-testid="pool-drag-cursor-preview"
                  ref={externalCursorPreviewRef}
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform="translate3d(10px, 10px, 0)"
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px solid"
                  borderColor={dragPreviewOriginBorder}
                  boxShadow="0 12px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(18, 24, 38, 0.5)"
                  overflow="hidden"
                  pointerEvents="none"
                  zIndex={30}
                  opacity={0.92}
                  display="none"
                  style={{ willChange: "transform" }}
                >
                  <Box
                    ref={externalCursorSurfaceRef}
                    width="100%"
                    height="100%"
                    bg="rgba(32,32,32,0.9)"
                  />
                  <Box
                    as="img"
                    ref={externalCursorImageRef}
                    alt=""
                    width="100%"
                    height="100%"
                    objectFit="cover"
                    display="none"
                  />

                  <Text
                    ref={externalCursorLabelRef}
                    position="absolute"
                    bottom="6px"
                    left="8px"
                    right="8px"
                    color="white"
                    fontWeight="bold"
                    bg="rgba(0, 0, 0, 0.55)"
                    borderRadius="6px"
                    px={2}
                    py={1}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    textAlign="center"
                    style={{
                      textShadow: "1px 1px 2px rgb(0, 0, 0)",
                      display: "none",
                    }}
                  />
                </Box>
              )}

              {isDragging && selectedCue && (
                // Show placement preview for dragged cue - shows where the cue being dragged from the grid would be placed following the cursor
                <Box
                  data-testid="drag-placement-preview"
                  ref={dragPlacementPreviewRef}
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform="translate3d(0, 0, 0)"
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px dashed"
                  borderColor={dragPreviewInvalidBorder}
                  bg={dragPreviewInvalidBg}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.16)"
                  pointerEvents="none"
                  zIndex={20}
                  display="none"
                  style={{ willChange: "transform" }}
                />
              )}

              {isDragging && selectedCue && (
                // Show cursor preview for dragged cue - shows a preview of the actual element being dragged from the grid following the cursor
                <Box
                  data-testid="drag-cursor-preview"
                  ref={dragCursorPreviewRef}
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform="translate3d(10px, 10px, 0)"
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px solid"
                  borderColor={dragPreviewOriginBorder}
                  boxShadow="0 12px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(18, 24, 38, 0.5)"
                  overflow="hidden"
                  pointerEvents="none"
                  zIndex={30}
                  opacity={0.92}
                  style={{ willChange: "transform" }}
                >
                  {(selectedCue.file?.type?.startsWith("image/") ||
                    selectedCue.file?.type?.startsWith("video/")) &&
                  selectedCue.file?.url ? (
                    selectedCue.file?.type?.startsWith("video/") ? (
                      <Box
                        as="video"
                        src={selectedCue.file?.url}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                        muted
                        playsInline
                        controls={false}
                        preload="auto"
                        style={{
                          transform: "translateZ(0)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      />
                    ) : (
                      <Box
                        as="img"
                        src={selectedCue.file?.url}
                        alt={selectedCue.name}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                      />
                    )
                  ) : (
                    <Box
                      width="100%"
                      height="100%"
                      bg={selectedCue.color || "rgba(32,32,32,0.9)"}
                    />
                  )}

                  {selectedCue.name?.trim() && (
                    // Show cue name on cursor preview if it exists - helps identify the element being dragged, especially for color-based cues without a file preview
                    <Text
                      position="absolute"
                      bottom="6px"
                      left="8px"
                      right="8px"
                      color="white"
                      fontWeight="bold"
                      bg="rgba(0, 0, 0, 0.55)"
                      borderRadius="6px"
                      px={2}
                      py={1}
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      textAlign="center"
                      style={{ textShadow: "1px 1px 2px rgb(0, 0, 0)" }}
                    >
                      {selectedCue.name}
                    </Text>
                  )}
                </Box>
              )}

              <Box
                data-testid="hover-preview"
                ref={hoverPreviewRef}
                position="absolute"
                left="0px"
                top="0px"
                width={`${columnWidth}px`}
                height={`${rowHeight}px`}
                bg={bgColorHover}
                borderRadius="16"
                transition="0"
                zIndex={-1}
                pointerEvents="none"
                display="none"
              />
            </Box>
          </Box>

          <ToolBox
            isOpen={isToolboxOpen}
            cue={selectedCue}
            onSave={handleToolboxSave}
            onClose={() => {
              setSelectedCue(null)
              setIsToolboxOpen(false)
            }}
          />
        </Box>
        <Dialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmAction}
          message={confirmMessage}
        />
      </div>
    </>
  )
}
export default EditMode
