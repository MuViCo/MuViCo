const admin = require("firebase-admin")

const { FIREBASE_SERVICE_KEY } = require("./config")

const logger = require("./logger")

const initializeFirebase = async () => {
  if (admin.apps.length) {
    return
  }
  const service_account = JSON.parse(atob(FIREBASE_SERVICE_KEY))
  admin.initializeApp({
    credential: admin.credential.cert(service_account),
  })
  logger.info("Firebase initialized successfully")
}

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Token missing" })
  }

  try {
    await initializeFirebase()
    const decodedToken = await admin.auth().verifyIdToken(token)
    req.user = decodedToken
    next()
  } catch (error) {
    res.status(401).json({ error: "Token verification failed" })
  }
}

initializeFirebase().catch((err) => {
  logger.error("Failed to initialize Firebase:", err)
})

module.exports = verifyToken
