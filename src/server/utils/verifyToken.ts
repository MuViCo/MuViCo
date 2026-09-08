/*
 * Firebase token verification middleware.
 * Initializes Firebase Admin once and validates bearer tokens for protected routes.
 */
import admin from "firebase-admin"
import type { NextFunction, Request, Response } from "express"

import { FIREBASE_SERVICE_KEY } from "./config"
import * as logger from "./logger"

const initializeFirebase = async () => {
  if (admin.apps.length) {
    return
  }
  const service_account = JSON.parse(atob(FIREBASE_SERVICE_KEY as string))
  admin.initializeApp({
    credential: admin.credential.cert(service_account),
  })
  logger.info("Firebase initialized successfully")
}

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Token missing" })
  }

  try {
    await initializeFirebase()
    const decodedToken = await admin.auth().verifyIdToken(token)
    // TODO(ts): req.user is typed as a UserDocument (../types) for the much
    // more common userExtractor case (utils/middleware.ts), but this
    // middleware is the one route (POST /api/login/firebase) that puts a raw
    // Firebase DecodedIdToken there instead, before a User document even
    // exists for it. Unifying the two would mean widening req.user's type
    // for every other route to accommodate this one.
    req.user = decodedToken as unknown as Request["user"]
    next()
  } catch (error) {
    res.status(401).json({ error: "Token verification failed" })
  }
}

initializeFirebase().catch((err) => {
  logger.error("Failed to initialize Firebase:", err)
})

export = verifyToken
