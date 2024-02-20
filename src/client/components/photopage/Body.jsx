import React, { useState } from 'react';
import photoService from "../../services/photos"
import { Box, Button, Center, Heading, Input, InputGroup, InputRightElement } from '@chakra-ui/react';

/**
 * Functional component for uploading an image.
 * @returns {JSX.Element} Rendered component.
 */
function Body() {
  const [file, setFile] = useState(null);

  /**
   * Handles changes in the selected file.
   * @param {Event} event - Change event triggered by file input.
   */
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  /**
   * Handles the upload process of the selected file.
   */
  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('pic', file);
      await photoService.photosPost(formData)
      //alert('File uploaded successfully');
      // After uploading, fetch images again to update the displayed images
      // This can be improved by updating state instead of refetching all images
      window.location.reload();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <Center>
      <Box>
        <Heading as="h1" mb={4}>Upload Image</Heading>
        <InputGroup mb={4}>
          <Input type="file" name="pic" accept=".png, .jpg, .jpeg, .gif" onChange={handleFileChange} required />
          <InputRightElement width="5rem">
            <Button size="sm" colorScheme="blue" h="1.75rem" onClick={handleUpload}>Upload</Button>
          </InputRightElement>
        </InputGroup>
      </Box>
    </Center>
  );
}

export default Body;
