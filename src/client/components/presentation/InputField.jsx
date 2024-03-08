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

const fileInputSchema = yup.object().shape({
  fileName: yup.string().required(),
})

const InputField = ({ onAdd }) => {
  const [fileName, setFileName] = useState("")
  const [file, setFile] = useState()
  const toast = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await fileInputSchema.validate({ fileName })
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
      description: "File added succesfully",
      duration: 5000,
      isClosable: true,
    })
    const formData = new FormData()
    formData.append("image", file)
    formData.append("name", fileName)
    onAdd({ formData })
    setFileName("")
    setFile(null)
  }

  const fileSelected = (event) => {
    const file = event.target.value[0]
    setFile(file)
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack mb={4} spacing={4}>
        <FormControl>
          <FormLabel htmlFor="fileName">File name</FormLabel>
          <Input
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            type="text"
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="file">Choose file</FormLabel>
          <Input onChange={fileSelected} type="file" />
        </FormControl>
        <Button type="submit" width="full">
          Add file
        </Button>
      </VStack>
    </form>
  )
}

export default InputField
