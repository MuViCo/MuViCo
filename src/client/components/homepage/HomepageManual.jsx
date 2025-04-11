import { Text, List, ListItem } from "@chakra-ui/react"

const HomepageManual = () => {
  return (
    <>
      <Text mb={4}>
        Welcome to the user manual. This modal provides guidance on how to use
        the application.
      </Text>
      <Text fontWeight="bold" mb={1}>
        Home page
      </Text>
      <Text mb={3}>
        After signing in, you will see the home page where you manage your
        presentations.
      </Text>
      <Text fontWeight="bold" mb={1}>
        Features on this page:
      </Text>
      <List spacing={2} mb={3} styleType="disc" pl={4}>
        <ListItem>
          New presentation button: click this to create a new presentation.
        </ListItem>
        <ListItem>
          Logout button: Click this to log out of your account.
        </ListItem>
      </List>
      <Text fontWeight="bold" mb={1}>
        Some title
      </Text>
      <Text mb={3}>some text</Text>
    </>
  )
}
export default HomepageManual
