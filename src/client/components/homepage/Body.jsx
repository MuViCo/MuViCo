import { Container } from '@chakra-ui/react'
import { Button } from "react-bootstrap"

const Body = () => {
    return(
        <Container>
            <Button type="submit" onClick={() => console.log("click")}>Create template</Button>
        </Container>
        
    )
}
export default Body