import React from "react"
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from '@chakra-ui/react'

const VideoInformationTable = ({data}) => {
    console.log(data)
      return (
        <TableContainer>
          <Table variant='simple'>
            <TableCaption>Controlpanel for media</TableCaption>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Link</Th>
              </Tr>
            </Thead>
            <Tbody>
            {data.length === 0 ?( 
             <Tr>
                <Td ></Td>
                <Td ></Td>
             </Tr>
            ):(
            
            data.map(file => (
              <Tr key={file._id}>
                <Td >{file.name}</Td>
                <Td >{file.url}</Td>
              </Tr>
            )))}
            </Tbody>
          </Table>
        </TableContainer>
      );
}

export default VideoInformationTable