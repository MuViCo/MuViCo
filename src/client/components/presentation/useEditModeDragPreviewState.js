import { useMemo, useRef, useState } from "react"
import {
  arePoolDragPreviewCellsEqual,
  areSpanOverrideMapsEqual,
} from "./editModeDragHelpers"

const useEditModeDragPreviewState = () => {
  const [internalDragSpanOverrides, setInternalDragSpanOverrides] = useState({})
  const [externalDragSpanOverrides, setExternalDragSpanOverrides] = useState({})
  const [poolDragPreviewCell, setPoolDragPreviewCell] = useState(null)

  const internalDragSpanOverridesRef = useRef({})
  const externalDragSpanOverridesRef = useRef({})
  const poolDragPreviewCellRef = useRef(null)

  const setInternalDragSpanOverridesIfChanged = (nextOverrides) => {
    const normalizedOverrides = nextOverrides || {}
    if (areSpanOverrideMapsEqual(internalDragSpanOverridesRef.current, normalizedOverrides)) {
      return
    }

    internalDragSpanOverridesRef.current = normalizedOverrides
    setInternalDragSpanOverrides(normalizedOverrides)
  }

  const setExternalDragSpanOverridesIfChanged = (nextOverrides) => {
    const normalizedOverrides = nextOverrides || {}
    if (areSpanOverrideMapsEqual(externalDragSpanOverridesRef.current, normalizedOverrides)) {
      return
    }

    externalDragSpanOverridesRef.current = normalizedOverrides
    setExternalDragSpanOverrides(normalizedOverrides)
  }

  const setPoolDragPreviewCellIfChanged = (nextCell) => {
    if (arePoolDragPreviewCellsEqual(poolDragPreviewCellRef.current, nextCell)) {
      return
    }

    poolDragPreviewCellRef.current = nextCell
    setPoolDragPreviewCell(nextCell)
  }

  const clearInternalDragSpanPreview = () => {
    setInternalDragSpanOverridesIfChanged({})
  }

  const clearExternalDragPreview = () => {
    setExternalDragSpanOverridesIfChanged({})
    setPoolDragPreviewCellIfChanged(null)
  }

  const previewCueSpanOverrides = useMemo(() => ({
    ...externalDragSpanOverrides,
    ...internalDragSpanOverrides,
  }), [externalDragSpanOverrides, internalDragSpanOverrides])

  return {
    poolDragPreviewCell,
    previewCueSpanOverrides,
    clearExternalDragPreview,
    clearInternalDragSpanPreview,
    setExternalDragSpanOverridesIfChanged,
    setInternalDragSpanOverridesIfChanged,
    setPoolDragPreviewCellIfChanged,
  }
}

export default useEditModeDragPreviewState
