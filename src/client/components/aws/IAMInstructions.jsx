import { Box, Heading, Text, OrderedList, ListItem, Link } from "@chakra-ui/react"

const IAMInstructions = () => {
    return (
        <Box maxW="lg" mx="auto" mt={6} p={4} borderWidth={1} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="lg" mb={4}>
                How to link your AWS IAM role
            </Heading>
            <OrderedList spacing={2} pl={5}>
                <ListItem>
                    Log in to your{" "}
                    <Link href="https://aws.amazon.com" isExternal color="blue.500">
                        AWS console
                    </Link>.
                </ListItem>
                <ListItem>Go to IAM &gt; Roles and click "Create Role".</ListItem>
                <ListItem>
                    Select "AWS account" &gt; "Another AWS account" and enter MuViCo’s AWS account ID:{" "}
                    <Text as="span" fontWeight="bold">851725318925</Text>.
                </ListItem>
                <ListItem>Attach "AmazonS3FullAccess" to permissions.</ListItem>
                <ListItem>Review and create the role. Copy the IAM Role ARN.</ListItem>
                <ListItem>Enter the IAM role ARN in the settings page below.</ListItem>
            </OrderedList>
        </Box>
    )
}

export default IAMInstructions