import { useState, useEffect } from "react"

import { Container, SimpleGrid, Button, Box, Text } from "@chakra-ui/react"
import adminServices from "../../services/admin"

const UsersList = () => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    adminServices.allUsers().then((users) => setUsers(users))
  }, [])

  return (
    <Container maxW="container.lg">
      <SimpleGrid columns={[1, 2, 3]} gap={6}>
        {users.map((user) => (
          <Box
            boxShadow="md"
            p="6"
            textAlign="center"
            rounded="md"
            bg="white"
            style={{ fontWeight: "bold" }}
            key={user.id}
          >
            <Text fontSize="lg">{user.username}</Text>
            <Button w="full" onClick={() => console.log(user.username)}>
              Remove
            </Button>
          </Box>
        ))}
      </SimpleGrid>
    </Container>
  )
}

export default UsersList
