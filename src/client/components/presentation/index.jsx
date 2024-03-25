import {
  Container,
  Button,
  SimpleGrid,
  Box,
  GridItem,
  Image,
  Link,
  Heading,
} from "@chakra-ui/react"

import presentationService from "../../services/presentation"
import CuesForm from "./Cues"

export const PresentationCues = ({ presentation, removeCue }) => (
  <>
    <Box py={4}>
      <Heading size="md">Cues:</Heading>
      <SimpleGrid columns={3} gap={6}>
        {presentation.cues.map((cue) => (
          <GridItem key={cue._id}>
            <p>Index: {cue.index}</p>
            <p>Name: {cue.name}</p>
            <p>Screen: {cue.screen}</p>
            <p>File: {cue.file.name}</p>
            <Button onClick={() => removeCue(cue._id)}>Remove cue</Button>
          </GridItem>
        ))}
      </SimpleGrid>
    </Box>
  </>
)

export const ScreenButtons = ({ cues, openWindow }) => {
  const buttons = []
  return (
    <>
      {cues.map((cue) => {
        if (buttons.includes(cue.screen)) {
          return null
        }
        buttons.push(cue.screen)

        return (
          <Button
            key={cue.name}
            onClick={() => openWindow(cue.file.url, cue.name, cue.screen)}
          >
            Open screen {cue.screen}
          </Button>
        )
      })}
    </>
  )
}

export const ChangeCueButton = ({ cues, updateScreen }) => (
  <>
    <Button onClick={() => updateScreen(cues)}>Next cue</Button>
  </>
)

const PresentationPage = ({ userId }) => {
  const { id } = useParams()

  const [showMode, setShowMode] = useState(false)

  const [presentationInfo, setPresentationInfo] = useState(null)

  const [screensList, setScreensList] = useState([])
  const [cueIndex, setCueIndex] = useState(2)

  const navigate = useNavigate()

  const handleShowMode = () => {
    setShowMode(!showMode)
  }

  useEffect(() => {
    presentationService
      .get(id)
      .then((presentation) => {
        setPresentationInfo(presentation)
      })
      .catch((error) => {
        navigate("/home")
      })
  }, [id, userId, navigate])

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, fileName } = cueData
    const formData = new FormData()
    formData.append("index", index)
    formData.append("cueName", cueName)
    formData.append("screen", screen)
    formData.append("image", file)
    formData.append("fileName", fileName)
    const response = await presentationService.addCue(id, formData)
    setPresentationInfo(response)
  }

  const removeCue = async (cueId) => {
    const updatedPresentation = await presentationService.removeCue(id, cueId)
    setPresentationInfo(updatedPresentation)
  }

  const deletePresentation = async () => {
    await presentationService.remove(id)
    navigate("/home")
  }

  const openWindow = (fileUrl, name, screen) => {
    const scrn = window.open(fileUrl, name, "width=600,height=600", true)
    screensList.push(scrn)
    console.log(screensList)
  }

  const changeCueIndex = () => {
    const changedCueIndex = cueIndex + 1
    setCueIndex(changedCueIndex)
  }

  const updateScreens = (cues) => {
    changeCueIndex()
    const cuesToUpdate = []
    console.log(cues)
    cues.forEach((cue) => {
      if (cue.index === cueIndex) {
        cuesToUpdate.push(cue)
      }
    })
    screensList.forEach((screen, index) => {
      if (index + 1 === cuesToUpdate[index].screen) {
        screen.location.replace(cuesToUpdate[index].file.url)
      }
    })
  }

  if (!showMode) {
    return (
      <Container>
        {presentationInfo && (
          <>
            <Heading>{presentationInfo.name}</Heading>
            <CuesForm addCue={addCue} />
            <PresentationCues
              presentation={presentationInfo}
              removeCue={removeCue}
            />
            <Button onClick={() => handleShowMode()}>
              {showMode ? "Edit mode" : "Show mode"}
            </Button>
            <Button onClick={() => deletePresentation()}>
              Delete presentation
            </Button>
          </>
        )}
      </Container>
    )
  }
  return (
    <Container>
      {presentationInfo && (
        <>
          <Heading>{presentationInfo.name}</Heading>
          <ScreenButtons cues={presentationInfo.cues} openWindow={openWindow} />
          <PresentationCues
            presentation={presentationInfo}
            removeCue={removeCue}
          />
          <Button onClick={() => handleShowMode()}>
            {showMode ? "Edit mode" : "Show mode"}
          </Button>
          <ChangeCueButton
            cues={presentationInfo.cues}
            updateScreen={updateScreens}
          />
        </>
      )}
    </Container>
  )
}

export default PresentationPage
