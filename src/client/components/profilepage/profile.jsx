import { useState } from "react"
import { ViewIcon, ViewOffIcon} from "@chakra-ui/icons" 
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Card,
  CardBody,
  useToast,
  IconButton
} from "@chakra-ui/react"

const Profile = ({ user }) => {
  const [passwords, setPasswords, showPasswords, setShowPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const toast = useToast()

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        status: "error",
        duration: 3,
        isClosable: true,
      })
      return
    }

    // TODO: Add password change API call here
    console.log("Password change requested")
    toast({
      title: "Success",
      description: "Password changed successfully",
      status: "success",
      duration: 3,
      isClosable: true,
    })
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  return (
    <Box maxW="container.md" mx="auto" py={8}>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        My Profile
      </Heading>

      {user && (
        <VStack spacing={8} align="stretch">
          {/* User Info Card */}
          <Card>
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Account Information
              </Heading>
              <VStack align="start" spacing={3}>
                <Box>
                  <FormLabel fontWeight="bold">Username</FormLabel>
                  <Input
                    value={user.username || "N/A"}
                    isReadOnly
                  />
                </Box>
                {/* <Box>
                  <FormLabel fontWeight="bold">Email</FormLabel>
                  <Input
                    value={user.email || "N/A"}
                    isReadOnly
                    bg="gray.100"
                  />
                </Box> */}
              </VStack>
            </CardBody>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardBody>
              <Heading as="h2" size="md" mb={4}>
                Change Password
              </Heading>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Current Password</FormLabel>
                    <Input
                      type="password"
                      name="currentPassword"
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                    />
                  </FormControl>

                  <HStack spacing={3} pt={4}>
                    <Button type="submit" colorScheme="purple">
                      Change Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPasswords({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        })
                      }
                    >
                      Return to Frontpage
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </VStack>
      )}
    </Box>
  )
}

export default Profile
