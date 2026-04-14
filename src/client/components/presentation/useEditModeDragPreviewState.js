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
