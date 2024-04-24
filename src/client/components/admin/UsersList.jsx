import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import {
  Container,
  SimpleGrid,
  Button,
  Box,
  Text,
  Card,
} from "@chakra-ui/react"
import adminServices from "../../services/admin"

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
          <Card key={user.id}>
            <Text fontSize="lg">{user.username}</Text>

            {user.isAdmin ? (
              "Admin"
            ) : (
              <>
                {" "}
                <Button w="full" onClick={() => onRemove(user.id)}>
                  Remove
                </Button>
                <Button w="full" onClick={() => makeAdmin(user.id)}>
                  Make Admin
                </Button>
              </>
            )}
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  )
}

export default UsersList
