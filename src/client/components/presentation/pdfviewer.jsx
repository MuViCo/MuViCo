import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString()

const PDFViewer = ({ src }) => {
 
  const [numPages, setNumPages] = useState()
  const [pageNumber, setPageNumber] = useState(1)


  function onDocumentLoadSuccess({numPages}) {
    setNumPages(numPages)
  }

  return (
  <Document file={src} onLoadSuccess={onDocumentLoadSuccess}>
    <Page pageNumber={pageNumber}/>
  </Document>
  )
}

export default PDFViewer
