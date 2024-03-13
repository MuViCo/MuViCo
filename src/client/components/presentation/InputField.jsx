import React, { useState } from "react"
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
} from "@chakra-ui/react"

import * as yup from "yup"

const videoInputSchema = yup.object().shape({
  videoName: yup.string().required(),
  videoUrl: yup.string().url().required(),
})



const InputField = ({ onAdd }) => {
  const [videoName, setVideoName] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await videoInputSchema.validate({ videoName, videoUrl })
    } catch (error) {
      toast({
        position: "top",
        title: "Validation Error",
        status: "error",
        description: error.message,
        duration: 5000,
        isClosable: true,
      })
      return
    }
    toast({
      position: "bottom",
      title: "Success!",
      status: "success",
      description: "Video added succesfully",
      duration: 5000,
      isClosable: true,
    })
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
        <Button type="submit" width="full">
          Add video
        </Button>
      </VStack>
    </form>
  )
}

export default InputField
