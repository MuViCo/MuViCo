import { Container } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import presentationService from '../../services/presentations'
import PresentationForm from './presentationform'
import Togglable from './Togglable'
import { Button } from '@chakra-ui/react';


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
    <Container>
      <div>
        <Togglable buttonLabel='new presentation'> 
          <PresentationForm createPresentation={createPresentation} />
        </Togglable>
        
        <h2>Presentations</h2>
        {presentations.map(presentation =>
          <Button
            key={presentation.id}
            
            onClick={() => handlePresentationClick(presentation.id)}
          >
            {presentation.name}
          </Button>
        )}
      </div>
    </Container>  
  )
}

export default Body
