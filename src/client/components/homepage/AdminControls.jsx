import { SimpleGrid, Button, Text } from "@chakra-ui/react"

const AdminControls = ({ isAdmin, navigate }) => (
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
