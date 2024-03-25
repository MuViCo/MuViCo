import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Button,
  SimpleGrid,
  Box,
  GridItem,
  Image,
  Link,
  Heading,
} from '@chakra-ui/react'

import presentationService from '../../services/presentation'
import CuesForm from './Cues'

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
  const [cueIndex, setCueIndex] = useState(1)

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
        navigate('/home')
      })
  }, [id, userId, navigate])

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, fileName } = cueData
    const formData = new FormData()
    formData.append('index', index)
    formData.append('cueName', cueName)
    formData.append('screen', screen)
    formData.append('image', file)
    formData.append('fileName', fileName)
    await presentationService.addCue(id, formData)
  }

  const removeCue = async (cueId) => {
    const updatedPresentation = await presentationService.removeCue(id, cueId)
    setPresentationInfo(updatedPresentation)
  }

  const deletePresentation = async () => {
    await presentationService.remove(id)
    navigate('/home')
  }

  const openWindow = (fileUrl, name, screen) => {
    console.log(fileUrl)
    console.log(name)
    console.log(screen)
    const scrn = window.open(fileUrl, name, 'width=600,height=600', true)
    console.log('scrn:', scrn)
    console.log('Screens: ', screensList)
    screensList.push(scrn)
    console.log(screensList)
  }

  const changeCue = ({ fileUrl, screen }) => {
    screensList[screen].location.replace(fileUrl)
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
              {showMode ? 'Edit mode' : 'Show mode'}
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
          <ScreenButtons cues={presentationInfo.cues} openWindow={openWindow} />
          <PresentationCues
            presentation={presentationInfo}
            removeCue={removeCue}
          />
          <Button onClick={() => handleShowMode()}>
            {showMode ? 'Edit mode' : 'Show mode'}
          </Button>
        </>
      )}
    </Container>
  )
}

export default PresentationPage
