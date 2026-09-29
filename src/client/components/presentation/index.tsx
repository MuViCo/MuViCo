/*
 * Main component for rendering the presentation page, which includes both edit mode and show mode functionality.
 * The component manages state for the current cue index, presentation size, show mode toggle, and various UI states such as toolbox and transition menu visibility.
 * It also handles user authentication and presentation deletion through custom hooks and utility functions.
 * The component fetches presentation information from the Redux store and passes necessary props down to the EditModeContainer component for rendering the appropriate UI based on the current mode.
 */
import { useEffect, useState } from "react"
import { useLocation, useParams, useNavigate } from "react-router-dom"
import {
  fetchPresentationInfo,
  fetchSharedPresentationInfo,
} from "../../redux/presentationReducer"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"

import EditModeContainer from "./EditModeContainer"
import useDeletePresentation from "../utils/useDeletePresentation"
import { useCustomToast } from "../utils/toastUtils"
import type { AuthUser } from "../../types"

interface PresentationPageProps {
  user?: AuthUser | null
  shared?: boolean
}

const PresentationPage = ({ shared = false }: PresentationPageProps) => {
  const { id: routeId, token } = useParams()
  const id = (shared ? token : routeId) as string
  const showToast = useCustomToast()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [cueIndex, setCueIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const {
    isDialogOpen,
    handleDeletePresentation,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeletePresentation()

  useEffect(() => {
    if (shared) return
    dispatch(fetchPresentationInfo(id))
  }, [id, navigate, dispatch, shared])

  useEffect(() => {
    if (!shared) return
    dispatch(fetchSharedPresentationInfo(token as string)).catch((error) => {
      showToast({
        status: "error",
        title: "Presentation unavailable",
        description: error.message,
      })
      navigate("/home")
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared, token, dispatch, navigate])

  const [presentationSize, setPresentationSize] = useState(0)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isTransitionMenuOpen, setIsTransitionMenuOpen] = useState(false)
  const [transitionType, setTransitionType] = useState("fade")

  useEffect(() => {
    const savedTransitionType = localStorage.getItem(
      `presentation-${id}-transition`
    )
    if (savedTransitionType) {
      setTransitionType(savedTransitionType)
    }
  }, [id])

  const handleTransitionChange = (value: string) => {
    setTransitionType(value)
    try {
      localStorage.setItem(`presentation-${id}-transition`, value)
    } catch (err) {
      console.warn("Could not persist transition preference:", err)
    }
  }

  const presentationInfo = useAppSelector((state) => state.presentation.cues)
  const indexCount = useAppSelector((state) => state.presentation.indexCount)
  const isShowMode = location.pathname.endsWith("/show")

  const toggleAudioMute = () => {
    setIsAudioMuted((prevMuted) => !prevMuted)
  }

  const updateCue = (direction: "Next" | "Previous") => {
    if (direction === "Next") {
      setCueIndex((prevCueIndex) => Math.min(indexCount - 1, prevCueIndex + 1))
    } else {
      setCueIndex((prevCueIndex) => Math.max(0, prevCueIndex - 1))
    }
  }

  return (
    <EditModeContainer
      id={id}
      cues={presentationInfo}
      isToolboxOpen={isToolboxOpen}
      setIsToolboxOpen={setIsToolboxOpen}
      transitionType={transitionType}
      onTransitionChange={handleTransitionChange}
      cueIndex={cueIndex}
      setCueIndex={setCueIndex}
      updateCue={updateCue}
      isAudioMuted={isAudioMuted}
      toggleAudioMute={toggleAudioMute}
      indexCount={indexCount}
      isShowMode={isShowMode}
      onEnterShow={() =>
        navigate(shared ? `/shared/${token}/show` : `/presentation/${id}/show`)
      }
      onExitShow={() =>
        navigate(shared ? `/shared/${token}` : `/presentation/${id}`)
      }
      sharedToken={shared ? token : undefined}
    />
  )
}

export default PresentationPage
