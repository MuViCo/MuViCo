/**
 * User model definition for MuViCo application
 * Each user has a unique username and may have multiple presentations
 * Passwords are stored as hashes for security
 * Users can authenticate via Firebase or traditional username/password
 * Admin users have elevated permissions for managing the application
 * This model is used by the user controller and routes to interact with the database
 * when creating, updating, retrieving, and deleting users and their associated presentations.
 */

const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

// Define the user schema for authentication and profile data
const userSchema = mongoose.Schema({
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
})

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  },
})

userSchema.plugin(uniqueValidator)

// Compile and export the User model
const User = mongoose.model("User", userSchema)

module.exports = User
