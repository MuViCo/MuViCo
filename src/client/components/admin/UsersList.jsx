import { useState, useEffect } from "react"

import { Container, SimpleGrid, Button, Box, Text } from "@chakra-ui/react"
import adminServices from "../../services/admin"

const UsersList = () => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    adminServices.allUsers().then((users) => setUsers(users))
  }, [])

  const onRemove = async (id) => {
    await adminServices.deleteUser(id)
    setUsers(users.filter((user) => user.id !== id))
  }

  return (
    <Container maxW="container.lg">
      <SimpleGrid columns={[1, 2, 3]} gap={6}>
        {users.map((user) =>
          user.isAdmin ? null : (
            <Box
              boxShadow="md"
              p="6"
              textAlign="center"
              rounded="md"
              style={{ fontWeight: "bold" }}
              key={user.id}
            >
              <Text fontSize="lg">{user.username}</Text>
              <Button w="full" onClick={() => onRemove(user.id)}>
                Remove
              </Button>
            </Box>
          )
        )}
      </SimpleGrid>
    </Container>
  )
}

export default UsersList
