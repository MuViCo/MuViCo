import { useState, useEffect } from "react"
import { useCustomToast } from "../utils/toastUtils"
import { Box, Heading, Input, Button, Text, VStack } from "@chakra-ui/react"
import awsService from "../../services/aws"

const IAMSettings = () => {
    const [iamRoleArn, setIamRoleArn] = useState("")
    const showToast = useCustomToast()

    useEffect(() => {
        const getSettings = async () => {
            try {
                const data = await awsService.getAWSSettings()
                setIamRoleArn(data.iamRoleArn || "")
            } catch (error) {
                console.error("Failed to load AWS settings:", error)
            }
        }
        getSettings()
    }, [])

    const saveSettings = async () => {
        try {
            await awsService.saveAWSSettings(iamRoleArn)
            showToast({ 
                title: "Settings saved successfully!",
                description: "Your IAM Role ARN and External ID have been updated.",
                status: "success"})
        } catch (error) {
            showToast({ 
                title: "Failed to save settings",
                description: "There was an issue saving your IAM Role ARN and External ID. Please try again.",
                status: "error"})
        }
    }

    return (
        <Box maxW="lg" mx="auto" mt={6} p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="lg" mb={4}>
                AWS IAM role settings
            </Heading>
            <Text color="gray.600" mb={4}>
                Enter your IAM role ARN to link your AWS account.
            </Text>

            <VStack spacing={4}>
                <Input placeholder="IAM Role ARN" value={iamRoleArn} onChange={(event) => setIamRoleArn(event.target.value)} />
                <Button colorScheme="blue" width="full" onClick={saveSettings}>
                    Save settings
                </Button>
            </VStack>
        </Box>
    )
}

export default IAMSettings