import { Container } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import presentationService from '../../services/presentations'
import PresentationForm from './presentationform'
import Togglable from './Togglable'
 
import Presentation from './Presentation'


const Body = () => {
  const [presentations, setPresentations] = useState([])

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

  return (
    <Container>
      <div>
      <Togglable buttonLabel='new presentation'>
        <PresentationForm createPresentation={createPresentation} />
      </Togglable>
      
      <h2>Presentations</h2>
      {presentations.map(presentation =>
        <Presentation presentation={presentation} />
      )}
    </div>
    </Container>  
  )
}
export default Body
