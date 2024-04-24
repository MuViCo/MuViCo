import { useState, useEffect } from "react"

import {
  Container,
  SimpleGrid,
  Button,
  Box,
  Text,
  Card,
  CardHeader,
  Heading,
  Flex,
} from "@chakra-ui/react"
import adminServices from "../../services/admin"
import randomLinearGradient from "../utils/randomGradient"

const UsersList = () => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    adminServices.allUsers().then((allUsers) => setUsers(allUsers))
  }, [])

  const onRemove = async (id) => {
    if (!window.confirm("Are you sure?")) return
    await adminServices.deleteUser(id)
    setUsers(users.filter((user) => user.id !== id))
  }

  const makeAdmin = async (id) => {
    if (!window.confirm("Are you sure?")) return
    await adminServices.makeAdmin(id)
    setUsers(
      users.map((user) => (user.id === id ? { ...user, isAdmin: true } : user))
    )
  }

  return (
    <Container maxW="container.lg">
      <SimpleGrid columns={[1, 2, 3]} gap={6}>
        {users.map((user) => (
          <Card
            key={user.id}
            height="280px"
            cursor="pointer"
            align="center"
            bg={randomLinearGradient()}
          >
            <CardHeader>
              <Heading
                size="md"
                color={"white"}
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.4)" }}
              >
                {user.username}
              </Heading>
            </CardHeader>

            {user.isAdmin ? (
              <Text fontSize="xl" fontWeight="bold" color="white">
                Admin
              </Text>
            ) : (
              <Flex gap={4}>
                {" "}
                <Button colorScheme="purple" onClick={() => onRemove(user.id)}>
                  Remove
                </Button>
                <Button colorScheme="purple" onClick={() => makeAdmin(user.id)}>
                  Make Admin
                </Button>
              </Flex>
            )}
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  )
}

export default UsersList
