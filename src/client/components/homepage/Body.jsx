import { 
  Container,
  SimpleGrid,
  Button
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import presentationService from '../../services/presentations'
import PresentationForm from './presentationform'
import Togglable from './Togglable'


const Body = () => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate() // Add useNavigate hook

  useEffect(() => {
    presentationService.getAll().then(presentations =>
      setPresentations(presentations)
    )
  }, [])

  const createPresentation = (presentationObject) => {
    presentationService.create(presentationObject).then(returnedPresentation => {
      setPresentations(presentations.concat(returnedPresentation))
    })
  }

  const handlePresentationClick = (presentationId) => {
    navigate(`/presentation/${presentationId}`);
  }

  return (
    <Container maxW="container.lg">
      <div>
        <Togglable buttonLabel='new presentation'> 
          <PresentationForm createPresentation={createPresentation} />
        </Togglable>
        <span>&nbsp;</span>
        <h2>Presentations</h2>
        <SimpleGrid columns={[1, 2, 3]} gap={6}>
          {presentations.map(presentation => (
            <Button
              key={presentation.id}
              onClick={() => handlePresentationClick(presentation.id)}
            >
              {presentation.name}
            </Button>
          ))}
        </SimpleGrid>
      </div>
    </Container>  
  )
}

export default Body
