/**
 * User model definition for MuViCo application
 * Each user has a unique username and may have multiple presentations
 * Passwords are stored as hashes for security
 * Users can authenticate via Firebase or traditional username/password
 * Admin users have elevated permissions for managing the application
 * This model is used by the user controller and routes to interact with the database
 * when creating, updating, retrieving, and deleting users and their associated presentations.
 */
import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

import type { UserAttrs } from "../types"

// Define the user schema for authentication and profile data
const userSchema = new mongoose.Schema<UserAttrs>({
  username: {
    type: String,
    unique: true,
    required: true,
    minlength: 3,
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
  passwordHash: String,
  presentations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Presentation",
    },
  ],
  isAdmin: { type: Boolean, default: false },
  driveToken: { type: String, default: null },
  refreshTokenHash: { type: String, default: null },
  refreshTokenExpires: { type: Date, default: null },
})

interface NormalizableUser {
  [key: string]: unknown
}

userSchema.set("toJSON", {
  // Same reason as presentation.ts's transform: the reshaped output (id
  // added, _id/__v/passwordHash/refreshToken* dropped) isn't UserAttrs.
  transform: (document, ret) => {
    const returnedObject = ret as unknown as NormalizableUser
    returnedObject.id = (
      returnedObject._id as { toString: () => string }
    ).toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
    delete returnedObject.refreshTokenHash
    delete returnedObject.refreshTokenExpires
  },
})

userSchema.plugin(uniqueValidator)

// Compile and export the User model
const User = mongoose.model<UserAttrs>("User", userSchema)

export = User
