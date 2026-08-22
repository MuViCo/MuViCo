/*
 * admin controls for the homepage, only visible to admins
 */
import { SimpleGrid, Button, Text } from "@chakra-ui/react"

import type { NavigateFunction } from "react-router-dom"

const AdminControls = ({
  isAdmin,
  navigate,
}: {
  isAdmin: boolean
  navigate: NavigateFunction
}) => (
  <>
    {" "}
    {isAdmin && (
      <>
        <Text fontSize="xl" fontWeight="bold">
          Admin controls
        </Text>
        <SimpleGrid columns={[1, 2, 3]} mb={100} gap={6}>
          <Button onClick={() => navigate("/users")}>All users</Button>
        </SimpleGrid>
      </>
    )}
  </>
)

export default AdminControls
