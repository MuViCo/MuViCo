/**
 * Custom hook to manage drag preview state for cues in presentation edit mode
 * - Maintains separate state for internal drag span overrides (reordering cues) and external drag span overrides (dragging in from media pool)
 * - Provides functions to set drag span overrides with change detection to avoid unnecessary updates
 * - Provides functions to clear drag previews when drag operations end
 * - Combines internal and external drag span overrides into a single previewCueSpanOverrides object for use in rendering cue spans during drag operations
 * - Uses useRef to store the current drag span overrides for change detection without causing re-renders
 * - Uses useMemo to compute the combined previewCueSpanOverrides object only when internal or external overrides change
 */

import { useMemo, useRef, useState } from "react"
import { areSpanOverrideMapsEqual } from "./editModeDragHelpers"

const useEditModeDragPreviewState = () => {
  const [internalDragSpanOverrides, setInternalDragSpanOverrides] = useState({})
  const [externalDragSpanOverrides, setExternalDragSpanOverrides] = useState({})

  const internalDragSpanOverridesRef = useRef({})
  const externalDragSpanOverridesRef = useRef({})

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

  const clearInternalDragSpanPreview = () => {
    setInternalDragSpanOverridesIfChanged({})
  }

  const clearExternalDragPreview = () => {
    setExternalDragSpanOverridesIfChanged({})
  }

  const previewCueSpanOverrides = useMemo(() => ({
    ...externalDragSpanOverrides,
    ...internalDragSpanOverrides,
  }), [externalDragSpanOverrides, internalDragSpanOverrides])

  return {
    previewCueSpanOverrides,
    clearExternalDragPreview,
    clearInternalDragSpanPreview,
    setExternalDragSpanOverridesIfChanged,
    setInternalDragSpanOverridesIfChanged,
  }
}

export default useEditModeDragPreviewState
