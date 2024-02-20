import { useState } from 'react'
import { FormControl, FormLabel, Input, Button, Box } from "@chakra-ui/react"

const PresentationForm = ({ createPresentation }) => {
    const [name, setName] = useState('')
    
    const addPresentation = (event) => {
        event.preventDefault()
        createPresentation({
        name: name,
        })
    
        setName('')
    }
    
    return (
        <Box>
        <h2>Create new</h2>
        <form onSubmit={addPresentation}>
            <FormControl>
                <FormLabel htmlFor='name'>name</FormLabel>
                <Input
                    id='name'
                    value={name}
                    onChange={({ target }) => setName(target.value)}
                />
            </FormControl>
            <Button id='create-button' type="submit">create</Button>
        </form>
        </Box>
    )
}

export default PresentationForm
