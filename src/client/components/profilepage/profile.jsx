import { useState, useRef } from "react"
import { ViewIcon, ViewOffIcon} from "@chakra-ui/icons"
import changepassword from "../../services/changepassword"
import Error from "../utils/Error" 
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
  InputGroup,
  InputRightElement,
  IconButton
} from "@chakra-ui/react"

const Profile = ({ user }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [formErrors, setFormErrors] = useState({})
  const newPasswordRef = useRef(null)
  const toast = useToast()

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check for empty fields
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Check minimum length
    if (passwords.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Check that new password differs from current password
    if (passwords.newPassword === passwords.currentPassword) {
      toast({
        title: "Error",
        description: "New password must be different from current password",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Check passwords match
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Call backend to change password
    try {
      const payload = {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }

      await changepassword.changepassword(payload)

      toast({
        title: "Success",
        description: "Password changed successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to change password",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
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
                <FormLabel fontWeight="bold">Username:&nbsp;&nbsp;&nbsp;&nbsp;<span style={{fontWeight: "normal"}}>{user.username || "N/A"}</span></FormLabel>
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
                    <InputGroup>
                      <Input
                        id="current-password"
                        data-testid="current-password-input"
                        type={showPasswords.currentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPasswords.currentPassword ? "Hide password" : "Show password"}
                          icon={showPasswords.currentPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPasswords({...showPasswords, currentPassword: !showPasswords.currentPassword})}
                          variant="ghost"
                          size="sm"
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>New Password</FormLabel>
                    <InputGroup>
                      <Input
                        id="new-password"
                        data-testid="new-password-input"
                        type={showPasswords.newPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        ref={newPasswordRef}
                        placeholder="Enter your new password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPasswords.newPassword ? "Hide password" : "Show password"}
                          icon={showPasswords.newPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPasswords({...showPasswords, newPassword: !showPasswords.newPassword})}
                          variant="ghost"
                          size="sm"
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                    {formErrors.password && <Error error={formErrors.password} />}
                  </FormControl>
                  

                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                      <Input
                        id="confirm-password"
                        data-testid="confirm-password-input"
                        type={showPasswords.confirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm your new password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPasswords.confirmPassword ? "Hide password" : "Show password"}
                          icon={showPasswords.confirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPasswords({...showPasswords, confirmPassword: !showPasswords.confirmPassword})}
                          variant="ghost"
                          size="sm"
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
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

const changePassword = ({ changepassword }) => {
  const [error, setError]= useState(null)
  const navigate = useNavigate()
  const toast = useToast()
  
  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await changepassword({ currentPassword, newPassword })
      toast({
        title: "Success",
        description: "Password changed successfully",
        status: "success",
        duration: 3,
        isClosable: true,
      })
      navigate("/")
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Failed to change password. Please check your current password and try again.")
    }
  }
  return (
      <SignUpForm
        onSubmit={onSubmit}
        error={error}
        handleTermsClick={handleTermsClick}
      />
    )
}

export default Profile
