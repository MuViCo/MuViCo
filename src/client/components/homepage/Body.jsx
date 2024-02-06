import { Container } from '@chakra-ui/react'
import { Button } from "react-bootstrap"
import { useNavigate } from 'react-router-dom'

const Body = () => {
  const navigate = useNavigate()
  const handleClick = () => {
    navigate("/presentation")
    
  }
  return(
        <Container>
            <Button type="submit" onClick={handleClick}>Create template</Button>
        </Container>
        
    )
}
export default Body
