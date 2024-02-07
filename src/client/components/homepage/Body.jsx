import { Container } from '@chakra-ui/react'
import { Button } from "react-bootstrap"
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import presentationService from '../../services/presentations'
import PresentationForm from '../../components/presentation/presentationform'
import presentations from '../../services/presentations'
import Togglable from './Togglable'


const Body = () => {
  const navigate = useNavigate()
  const handleClick = () => {
    navigate("/presentation")
    }

  const presentationFormRef = useRef()

  const addPresentation = (presentationObject) => {
    presentationService
        .create(presentationObject)
        .then(returnedPresentation => {
          setPresentations(presentations.concat(returnedPresentation))
          presentationFormRef.current.toggleVisibility()
          setErrorMessage('Created new presentation')
        })
  }

  const handleRemove = async (id) => {
    const presentation = presentations.find(p => p.id === id)
    if (window.confirm('Remove presentation?')) {
      presentationService
        .remove(id)
        .then(() => {
          setPresentations(presentations.filter(blog => blog.id !== id))
          setErrorMessage('Removed presentation ${presentation.name}')
        })
    }
  }

  return(
        <Container>
            <Togglable buttonLabel="New presentation" ref={presentationFormRef}>
              <PresentationForm createPresentation={addPresentation} />
              </Togglable>
        </Container>
        
    )
}
export default Body
