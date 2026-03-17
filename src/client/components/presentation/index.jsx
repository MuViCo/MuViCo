import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex, Box, Text, IconButton, Input, Select, useToast } from "@chakra-ui/react"
import { fetchPresentationInfo } from "../../redux/presentationReducer"
import "reactflow/dist/style.css"
import { useDispatch, useSelector } from "react-redux"

import ShowMode from "./ShowMode"
import EditModeContainer from "./EditModeContainer"
import PresentationTitle from "./PresentationTitle"
import Dialog from "../utils/AlertDialog"
import useDeletePresentation from "../utils/useDeletePresentation"
import TutorialGuide from "../tutorial/TutorialGuide"
import { presentationTutorialSteps } from "../data/tutorialSteps"

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
  const [showMode, setShowMode] = useState(false)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isTransitionMenuOpen, setIsTransitionMenuOpen] = useState(false)
  const [transitionType, setTransitionType] = useState("fade")

  const toast = useToast()

  const presentationInfo = useSelector((state) => state.presentation.cues)
  const presentationName = useSelector((state) => state.presentation.name)
  const indexCount = useSelector((state) => state.presentation.indexCount)

  const toggleAudioMute = () => {
    setIsAudioMuted((prevMuted) => !prevMuted)
  }

  return <EditModeContainer
    id={id}
    cues={presentationInfo}
    isToolboxOpen={isToolboxOpen}
    setIsToolboxOpen={setIsToolboxOpen}
    isTransitionMenuOpen={isTransitionMenuOpen}
    setIsTransitionMenuOpen={setIsTransitionMenuOpen}
    transitionType={transitionType}
    setTransitionType={setTransitionType}
    isShowMode={showMode === true}
    cueIndex={cueIndex}
    isAudioMuted={isAudioMuted}
    toggleAudioMute={toggleAudioMute}
    indexCount={indexCount}
  />
}

export default PresentationPage
