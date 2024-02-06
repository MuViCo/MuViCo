import { useState } from 'react'

export const FileUploadComponent = () => {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    setSelectedFile(file)
  }

  return (
    <div>
      <h1>Upload a Picture</h1>
      <input type="file" onChange={handleFileUpload} />
      {selectedFile && (
        <div>
          <h2>Selected Picture:</h2>
          <img src={URL.createObjectURL(selectedFile)} alt="Uploaded" />
        </div>
      )}
    </div>
  )
}

