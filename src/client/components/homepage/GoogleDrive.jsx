import { useState, useEffect } from "react"
import { Box, Heading, Text, VStack, Button } from "@chakra-ui/react"

const CLIENT_ID = "1084292903724-jpd3ivkrfjjc66o1c8q7nsb2jhf28ikk.apps.googleusercontent.com"
const API_KEY = "AIzaSyBp3YmS2kptNpV5G1xuE6UzYdxrRUAWyZQ"

// Include openid, email, and profile scopes to retrieve user info.
const SCOPES = "openid email profile https://www.googleapis.com/auth/drive.metadata.readonly"
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"

function GoogleDriveAuth() {
  const [gapiLoaded, setGapiLoaded] = useState(false)
  const [gisLoaded, setGisLoaded] = useState(false)
  const [tokenClient, setTokenClient] = useState(null)
  const [files, setFiles] = useState([])
  const [googleUser, setGoogleUser] = useState(null)

  useEffect(() => {
    const loadScripts = () => {
      const script1 = document.createElement("script")
      script1.src = "https://apis.google.com/js/api.js"
      script1.async = true
      script1.defer = true
      script1.onload = gapiLoadedCallback
      document.body.appendChild(script1)

      const script2 = document.createElement("script")
      script2.src = "https://accounts.google.com/gsi/client"
      script2.async = true
      script2.defer = true
      script2.onload = gisLoadedCallback
      document.body.appendChild(script2)
    }

    loadScripts()
  }, [])

  const gapiLoadedCallback = async () => {
    window.gapi.load("client", async () => {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      })
      setGapiLoaded(true)
    })
  }

  const gisLoadedCallback = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => handleAuthResponse(resp), 
      access_type: "offline", 
      prompt: "consent",
    })
    setTokenClient(client)
    setGisLoaded(true)
  }

  const handleAuthClick = () => {
    if (!tokenClient) return
    if (!window.gapi.client.getToken()) {
      tokenClient.requestAccessToken({ prompt: "consent" })
    } else {
      tokenClient.requestAccessToken({ prompt: "" })
    }
  }

  const handleAuthResponse = async (resp) => {
    if (resp.error) {
      console.error("Error during authentication:", resp)
      return
    }
    try {
        localStorage.setItem("googleToken", resp.access_token)
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${resp.access_token}` },
        });    
      const userInfo = await userInfoResponse.json()
      setGoogleUser(userInfo);
      // Save the complete token object to your backend
      await googleDriveService.saveGoogleSettings(resp)
    } catch (error) {
      console.error("Failed to fetch user info:", error)
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken()
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token)
      window.gapi.client.setToken("")
      setFiles([])
      setGoogleUser(null)
    }
  }

  return (
    <Box maxW="lg" mx="auto" mt={6} p={6} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <Heading as="h2" size="lg" mb={4}>
        Google Drive Account Settings
      </Heading>
      <Text color="gray.600" mb={4}>
        Sign in with your Google account to link your Google Drive.
      </Text>

      <VStack spacing={4}>
        {googleUser ? (
          <>
            <Text>Signed in as: {googleUser.email}</Text>
            <Button colorScheme="red" onClick={handleSignoutClick}>
              Sign Out
            </Button>
          </>
        ) : (
          <Button colorScheme="purple" onClick={handleAuthClick} disabled={!gapiLoaded || !gisLoaded}>
            Sign in with Google
          </Button>
        )}
      </VStack>
      {files.length > 0 && (
        <Box mt={4}>
          <Heading as="h4" size="md">Files:</Heading>
          {files.map((file) => (
            <Text key={file.id}>{file.name} ({file.id})</Text>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default GoogleDriveAuth
