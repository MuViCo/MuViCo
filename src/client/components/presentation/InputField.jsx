import React, { useState } from "react"
import { VStack, FormControl, FormLabel, Input, Button } from "@chakra-ui/react"

const InputField = ({ onAdd }) => {
  const [videoName, setVideoName] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()
    onAdd({ videoName, videoUrl })
    setVideoName("")
    setVideoUrl("")
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack mb={4} spacing={4}>
        <FormControl>
          <FormLabel htmlFor="videoName">Video name</FormLabel>
          <Input
            id="videoName"
            value={videoName}
            onChange={(e) => setVideoName(e.target.value)}
            type="text"
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="videoUrl">Video url</FormLabel>
          <Input
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            type="text"
          />
        </FormControl>
        <Button type="submit" colorScheme="purple" width="full">
          Add video
        </Button>
      </VStack>
    </form>
  )
}

export default InputField
