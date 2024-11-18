const admin = require("firebase-admin")
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager")

const {
  BUCKET_REGION,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
} = require("./config")


const initializeFirebase = async () => {
  const secret_name = "ServiceAccountKey"

  const client = new SecretsManagerClient({
    region: BUCKET_REGION,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  })

    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", 
      })
    )


    const secret = JSON.parse(response.SecretString)

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(secret),
      })
      console.log("Firebase initialized successfully.")
    }

}




const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]


  if (!token) {
    return res.status(401).json({ error: "no token" })
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token)
    req.user = decodedToken
    next()
  } catch (error) {
    res.status(401).json({ error: "Token verification failed" })
  }
}

initializeFirebase().catch((err) => {
  console.error("Failed to initialize Firebase:", err)
})

module.exports = verifyToken
