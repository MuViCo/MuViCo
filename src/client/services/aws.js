import axios from "axios"
const baseUrl = "/api/aws"

const getAWSSettings = async () => {
    try {
        const response = await axios.get(baseUrl)
        return response.data
    } catch (error) {
        console.error("Error fetching AWS settings:", error)
        throw error
    }
}

const saveAWSSettings = async (iamRoleArn) => {
    try {
        const response = await axios.post(baseUrl, { iamRoleArn })
        return response.data
    } catch (error) {
        console.error("Error saving AWS settings:", error)
        throw error
    }
}

export default { getAWSSettings, saveAWSSettings }