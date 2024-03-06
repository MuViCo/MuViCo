import { useState } from 'react'
import { FormControl, FormLabel, Input, Button, Box } from "@chakra-ui/react"

const ConnectionForm = ({ createConnection }) => {
    const [ipAddress, setIpAddress] = useState('')
    
    const addConnection = (event) => {
        event.preventDefault()
        createConnection({
            ipAddress: ipAddress,
        })

        setIpAddress('')
    }
    
    return (
        <Box>
            <h2>Connections</h2>
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
