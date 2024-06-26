import { Button, Box, Heading, IconButton } from "@chakra-ui/react"
import { useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"

const screenCount = 4

export const ScreenButtons = ({ openWindow, closeWindow, screens }) => (
  <>
    {[...Array(screenCount)].map((_, index) => {
      if (screens[index]) {
        return (
          <Button
            colorScheme="pink"
            key={index + 1}
            onClick={() => closeWindow(index + 1)}
          >
            Close screen: {index + 1}
          </Button>
        )
      }
      return (
        <Button
          colorScheme="purple"
          key={index + 1}
          onClick={() => openWindow(index + 1)}
        >
          Open screen: {index + 1}
        </Button>
      )
    })}
  </>
)

export const ChangeCueButton = ({ updateScreen, direction }) => (
  <>
    {direction === "Previous" ? (
      <IconButton
        aria-label="Previous Cue"
        icon={<ChevronLeftIcon />}
        onClick={() => updateScreen(direction)}
        colorScheme="purple"
        size="md"
      />
    ) : (
      <IconButton
        aria-label="Next Cue"
        icon={<ChevronRightIcon />}
        onClick={() => updateScreen(direction)}
        colorScheme="purple"
        size="md"
      />
    )}
  </>
)

/**
 * Renders the Show Mode buttons component.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Array} props.screensList - The list of screens.
 * @param {Function} props.setScreensList - The function to set the screens list.
 * @param {Object} props.presentationInfo - The presentation information.
 * @param {Function} props.setCueIndex - The function to set the cue index.
 * @param {number} props.cueIndex - The current cue index.
 * @returns {JSX.Element} The rendered component.
 */
const ShowModeButtons = ({
  screensList,
  setScreensList,
  presentationInfo,
  setCueIndex,
  cueIndex,
}) => {
  const changeCueIndex = (direction) => {
    if (direction === "Next") {
      const newIndex = cueIndex + 1
      setCueIndex(newIndex)
      return newIndex
    }
    const newIndex = cueIndex === 0 ? 0 : cueIndex - 1
    setCueIndex(newIndex)
    return newIndex
  }

  const updateScreens = (direction) => {
    const newIndex = changeCueIndex(direction)
    presentationInfo.cues.forEach((cue) => {
      if (cue.index === newIndex) {
        const screen = screensList[cue.screen - 1]
        if (screen) {
          screen.location.replace(cue.file.url)
        }
      }
    })
  }

  useEffect(() => {
    const handleKeyUp = (e) => {
      if (e.key === "ArrowRight") {
        updateScreens("Next")
      }
      if (e.key === "ArrowLeft") {
        updateScreens("Previous")
      }
    }

    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keyup", handleKeyUp)
    }
  })

  const openWindow = (screen) => {
    const cueToOpen = presentationInfo.cues.find(
      (cue) => cue.screen === screen && cue.index === cueIndex
    )
    if (!cueToOpen) {
      alert("No cues found for this screen") // eslint-disable-line no-alert
      return
    }
    const scrn = window.open(
      cueToOpen.file.url,
      cueToOpen.name,
      "width=600,height=600",
      true
    )
    const newScreens = [...screensList]
    newScreens[screen - 1] = scrn
    setScreensList(newScreens)
  }

  const closeWindow = (screen) => {
    const newScreens = [...screensList]
    newScreens[screen - 1].close()
    newScreens[screen - 1] = null
    setScreensList(newScreens)
  }

  return (
    <>
      <ScreenButtons
        openWindow={openWindow}
        closeWindow={closeWindow}
        screens={screensList}
      />
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        flex="1"
        gap={4}
      >
        <ChangeCueButton updateScreen={updateScreens} direction="Previous" />
        <Heading size="md">Cue {cueIndex}</Heading>
        <ChangeCueButton updateScreen={updateScreens} direction="Next" />
      </Box>
    </>
  )
}

export default ShowModeButtons
