/*presentation.js - Mongoose schema for presentation data
  * This schema defines the structure of presentation documents 
    in the MongoDB database.
  * Each presentation has a name, associated user, storage type, 
    screen count, index count, and arrays of cues and audio cues.
  * Cues and audio cues contain information about their index, 
    name, associated media file, loop setting, and color (for cues).
  * The schema also includes a toJSON transformation to format 
    the output when converting documents to JSON.
  * This file is used by the presentation controller and routes 
    to interact with the database when creating, updating, retrieving, 
    and deleting presentations and their cues.
*/

const mongoose = require("mongoose")

const presentationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  storage: {
    type: String,
    required: true,
    default: "aws",
  },

  screenCount: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 8,
  },

  indexCount: {
    type: Number,
    default: 5,
    min: 1,
    max: 101,
  },

  cues: [
    {
      index: { type: Number, required: true },
      name: { type: String, required: true },
      screen: { type: Number, required: true },
      
      color: {
        type: String,
        match: /^#([0-9A-F]{3}){1,2}$/i,
        default: "#000000",
      },

      file: {
        id: String,
        name: String,
        url: String,
        driveId: String,
        size: { type: String, default: "0" },
        type: { type: String, default: "image/jpeg" },
      },
      loop: { type: Boolean, default: false },
    },
  ],

  audioCues: [
    {
      index: { type: Number, required: true },
      name: { type: String, required: true },
      file: {
        id: String,
        name: String,
        url: String,
        driveId: String,
        size: { type: String, default: "0" },
        type: { type: String, default: "audio/mpeg" },
      },
      loop: { type: Boolean, default: false },
    },
  ],
})

presentationSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model("Presentation", presentationSchema)
