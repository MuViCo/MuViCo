import { useState } from "react"
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Flex,
  Select,
} from "@chakra-ui/react"

const PresentationForm = ({ createPresentation, onCancel }) => {
  const [name, setName] = useState("")
  const [screenCount, setScreenCount] = useState(1)
  const [startingFrameColor, setStartingFrameColor] = useState("#000000")

  const addPresentation = (event) => {
    event.preventDefault()
    createPresentation({
      name,
      screenCount: parseInt(screenCount, 10),
      startingFrameColor
    })

    setName("")
    setScreenCount(1)
    setStartingFrameColor("#FF0000")
    onCancel()
  }

  return (
    <Box>
      <form onSubmit={addPresentation}>
        <FormControl isRequired>
          <FormLabel htmlFor="name" mb={3} fontWeight="bold">
            Name
          </FormLabel>
          <Input
            data-testid="presentation-name"
            id="name"
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
          
          <FormLabel htmlFor="screen-count" fontWeight="bold" style={{ marginTop: ".5em", whiteSpace: "nowrap" }}>
            Screen Count (max 8)
          </FormLabel>
          <Input
            data-testid="presentation-screen-count"
            id="screen-count"
            type="number"
            min="1"
            max="8"
            value={screenCount}
            onChange={({ target }) => setScreenCount(target.value)}
          />
          
          <FormLabel fontWeight="bold" style={{display:"none", marginTop: ".5em" }}>
            Starting Frame Color
          </FormLabel>
          <Select style={{display:"none"}}
            data-testid="starting-frame-color"
            value={startingFrameColor} 
            onChange={(e) => setStartingFrameColor(e.target.value)}
            placeholder="Select color"
          >
            <option value="#000000" style={{backgroundColor: "yellow", color: "white"}}>Black</option>
            <option value="white" style={{backgroundColor: "white", color: "black"}}>White</option>
            <option value="indigo" style={{backgroundColor: "#0c2bde", color: "white"}}>Indigo</option>
            <option value="tropicalindigo" style={{backgroundColor: "#e5ed9f", color: "black"}}>Tropical indigo</option>
           {/* <ColorPickerWithPresets
            color={startingFrameColor}
            onChange={setStartingFrameColor}
            presetColors={presetColors}
          />  */}
          </Select>
        </FormControl>
        <Flex align="center" mt={2} mb={4}>
          <Button id="create-button" type="submit" colorScheme="purple">
            create
          </Button>
          <Button id="cancel-button" ml={2} onClick={onCancel}>
            cancel
          </Button>
        </Flex>
      </form>
    </Box>
  )
}

export default PresentationForm
