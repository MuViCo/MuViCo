/*
 * Profile page component for displaying user information and allowing password changes.
 * Includes form validation using Yup and error handling for both validation and API errors.
 * Features:
 * - Displays username (and email if available) in a read-only format.
 * - Provides a form for changing the password with fields for current password, new password, and confirm password.
 * - Validates form inputs with specific rules for password complexity and matching.
 * - Shows error messages for validation errors and API errors using Chakra UI's toast notifications.
 */
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import * as yup from "yup"
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import authService from "../../services/auth"
import Error from "../utils/Error"
import { useCustomToast } from "../utils/toastUtils"

import {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
} from "../../../constants.js"

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
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react"

const validationSchema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(
      minPwLength,
      `Password must be at least ${minPwLength} characters long`
    )
    .max(maxPwLength, `Password must be at most ${maxPwLength} characters`)
    .test(
      "password-not-whitespace-only",
      "Password cannot contain only spaces",
      (value) => !value || value.trim().length > 0
    )
    .test(
      "allowed-password-characters",
      "Password contains unsupported characters",
      (value) => !value || !invalidPwCharRegex.test(value)
    )
    .test(
      "password-different-from-current",
      "New password must be different from current password",
      function (value) {
        return !value || value !== this.parent.currentPassword
      }
    ),
  confirmPassword: yup
    .string()
    // `null` is accepted at runtime by yup.oneOf but is absent from its
    // parameter type, so the array is widened rather than the value changed.
    .oneOf(
      [yup.ref("newPassword"), null] as any[],
      "New passwords do not match"
    )
    .required("Confirm password is required"),
})

import type { ChangeEvent, FormEvent } from "react"
import type { AuthUser } from "../../types"

interface PasswordFields {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/** Field name -> validation message, filled from yup's inner errors. */
type ProfileErrors = Partial<Record<keyof PasswordFields, string>>

const Profile = ({ user }: { user: AuthUser }) => {
  const navigate = useNavigate()
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
  const [formErrors, setFormErrors] = useState<ProfileErrors>({})
  const showToast = useCustomToast()

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as {
      name: keyof PasswordFields
      value: string
    }
    setPasswords({
      ...passwords,
      [name]: value,
    })

    setFormErrors((prevErrors) => {
      if (!prevErrors[name]) {
        return prevErrors
      }

      const nextErrors = { ...prevErrors }
      delete nextErrors[name]
      return nextErrors
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await validationSchema.validate(passwords, { abortEarly: false })
      setFormErrors({})

      const payload = {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }

      await authService.changepassword(payload)

      showToast({
        title: "Success",
        description: "Password changed successfully",
        status: "success",
      })

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      if (err?.name === "ValidationError") {
        const errors: ProfileErrors = {}
        err.inner.forEach((validationError: yup.ValidationError) => {
          const path = validationError.path as keyof PasswordFields | undefined
          if (path && !errors[path]) {
            errors[path] = validationError.message
          }
        })
        setFormErrors(errors)
        return
      }

      showToast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to change password",
        status: "error",
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
                <FormLabel fontWeight="bold">
                  Username:&nbsp;&nbsp;&nbsp;&nbsp;
                  <span style={{ fontWeight: "normal" }}>
                    {user.username || "N/A"}
                  </span>
                </FormLabel>
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
                        type={
                          showPasswords.currentPassword ? "text" : "password"
                        }
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={
                            showPasswords.currentPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          icon={
                            showPasswords.currentPassword ? (
                              <ViewOffIcon />
                            ) : (
                              <ViewIcon />
                            )
                          }
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              currentPassword: !showPasswords.currentPassword,
                            })
                          }
                          variant="ghost"
                          size="sm"
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                    {formErrors.currentPassword && (
                      <Error error={formErrors.currentPassword} />
                    )}
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
                        placeholder="Enter your new password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={
                            showPasswords.newPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          icon={
                            showPasswords.newPassword ? (
                              <ViewOffIcon />
                            ) : (
                              <ViewIcon />
                            )
                          }
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              newPassword: !showPasswords.newPassword,
                            })
                          }
                          variant="ghost"
                          size="sm"
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                    {formErrors.newPassword && (
                      <Error error={formErrors.newPassword} />
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                      <Input
                        id="confirm-password"
                        data-testid="confirm-password-input"
                        type={
                          showPasswords.confirmPassword ? "text" : "password"
                        }
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm your new password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={
                            showPasswords.confirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          icon={
                            showPasswords.confirmPassword ? (
                              <ViewOffIcon />
                            ) : (
                              <ViewIcon />
                            )
                          }
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirmPassword: !showPasswords.confirmPassword,
                            })
                          }
                          variant="ghost"
                          size="sm"
                          tabIndex={-1}
                        />
                      </InputRightElement>
                    </InputGroup>
                    {formErrors.confirmPassword && (
                      <Error error={formErrors.confirmPassword} />
                    )}
                  </FormControl>

                  <HStack spacing={3} pt={4}>
                    <Button type="submit" colorScheme="purple">
                      Confirm changes
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/")}>
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
