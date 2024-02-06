import { Heading, Container } from '@chakra-ui/react'
import PDFViewer from './pdfviewer'


export const PresentationPage = () => {
  return (
  <Container>
      <Heading as="h2">New Presentation</Heading>
      <PDFViewer src="./notes.pdf" />
    </Container>
  )
}

export default PresentationPage
