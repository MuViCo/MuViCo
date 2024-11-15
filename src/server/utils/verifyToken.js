const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")

const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json")

if (!fs.existsSync(serviceAccountPath)) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set")
  }
  fs.writeFileSync(serviceAccountPath, serviceAccountKey)
}

const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
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

module.exports = verifyToken
