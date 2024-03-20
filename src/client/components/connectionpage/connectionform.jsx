import { useState, useEffect } from "react"
import {
  FormControl, FormLabel, Input, Button, Box,
} from "@chakra-ui/react"
import connectService from "../../services/connection"

const ConnectionForm = () => {
  const [ipAddress, setIpAddress] = useState("")

  const addConnection = (event) => {
    event.preventDefault()
    connectService.connect(ipAddress)
  }

  return (
        <Box>
            <h2>Set Master IP</h2>
            <form onSubmit={addConnection}>
                <FormControl>
                    <FormLabel htmlFor='ipAddress'>IP Address</FormLabel>
                    <Input
                        id='ipAddress'
                        value={ipAddress}
                        onChange={({ target }) => setIpAddress(target.value)}
                    />
                </FormControl>
                <Button id='create-button' type="submit">Create Connection</Button>
            </form>
        </Box>
  )
}

export default ConnectionForm
