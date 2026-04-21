/*
* Main component for rendering the presentation page, which includes both edit mode and show mode functionality.
* The component manages state for the current cue index, presentation size, show mode toggle, and various UI states such as toolbox and transition menu visibility.
* It also handles user authentication and presentation deletion through custom hooks and utility functions. 
* The component fetches presentation information from the Redux store and passes necessary props down to the EditModeContainer component for rendering the appropriate UI based on the current mode. 
 */
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchPresentationInfo } from "../../redux/presentationReducer"
import { useDispatch, useSelector } from "react-redux"

import EditModeContainer from "./EditModeContainer"
import useDeletePresentation from "../utils/useDeletePresentation"

const PresentationPage = ({ user }) => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [cueIndex, setCueIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const {
    isDialogOpen,
    handleDeletePresentation,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeletePresentation()


  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, navigate, dispatch])


  const [presentationSize, setPresentationSize] = useState(0)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isTransitionMenuOpen, setIsTransitionMenuOpen] = useState(false)
  const [transitionType, setTransitionType] = useState("fade")

  const presentationInfo = useSelector((state) => state.presentation.cues)
  const presentationName = useSelector((state) => state.presentation.name)
  const indexCount = useSelector((state) => state.presentation.indexCount)

  const toggleAudioMute = () => {
    setIsAudioMuted((prevMuted) => !prevMuted)
  }

  const updateCue = (direction) => {
    if (direction === "Next") {
      setCueIndex((prevCueIndex) => Math.min(indexCount - 1, prevCueIndex + 1))
    } else {
      setCueIndex((prevCueIndex) => Math.max(0, prevCueIndex - 1))
    }
  }

  return <EditModeContainer
    className="presentation-page"
    id={id}
    cues={presentationInfo}
    isToolboxOpen={isToolboxOpen}
    setIsToolboxOpen={setIsToolboxOpen}
    isTransitionMenuOpen={isTransitionMenuOpen}
    setIsTransitionMenuOpen={setIsTransitionMenuOpen}
    transitionType={transitionType}
    setTransitionType={setTransitionType}
    cueIndex={cueIndex}
    setCueIndex={setCueIndex}
    updateCue={updateCue}
    isAudioMuted={isAudioMuted}
    toggleAudioMute={toggleAudioMute}
    indexCount={indexCount}
  />
}

export default PresentationPage
