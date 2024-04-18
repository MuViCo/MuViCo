import { Button, Box, Heading } from "@chakra-ui/react"

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

export const ChangeCueButton = ({ cues, updateScreen, direction }) => (
  <>
    <Button
      width={40}
      colorScheme="purple"
      onClick={() => updateScreen(cues, direction)}
    >
      {direction} cue
    </Button>
  </>
)

const ShowModeButtons = ({
  openWindow,
  closeWindow,
  screens,
  cues,
  updateScreen,
  cueIndex,
}) => (
  <>
    <ScreenButtons
      openWindow={openWindow}
      closeWindow={closeWindow}
      screens={screens}
    />
    <Box
      display="flex"
      justifyContent="flex-end"
      alignItems="center"
      flex="1"
      gap={4}
    >
      <ChangeCueButton
        cues={cues}
        updateScreen={updateScreen}
        direction="Previous"
      />
      <Heading size="md">Cue {cueIndex}</Heading>
      <ChangeCueButton
        cues={cues}
        updateScreen={updateScreen}
        direction="Next"
      />
    </Box>
  </>
)

export default ShowModeButtons
