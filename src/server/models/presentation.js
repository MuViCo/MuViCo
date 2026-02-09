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
    minlength: 1,
    maxlength: 100,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  storage: {
    type: String,
    required: true,
    default: "aws",
    enum: {
      values: ["aws", "googleDrive"],
      message: "storage must be either aws or googleDrive",
    }
  },

  screenCount: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 8,
    set: v => (v === undefined || v === null ? v : Math.round(v)),
    validate: {
      validator: Number.isInteger,
      message: "screenCount must be an integer"
    }
  },

  indexCount: {
    type: Number,
    default: 5,
    min: 1,
    max: 101,
    set: v => (v === undefined || v === null ? v : Math.round(v)),
    validate: {
      validator: Number.isInteger,
      message: "indexCount must be an integer"
    }
  },

  cues: [
    {
      index: { 
        type: Number, 
        required: true,
        set: v => (v === undefined || v === null ? v : Math.round(v)),
        validate: {
          validator: Number.isInteger,
          message: "index must be an integer"
        }
      },
      name: { type: String, required: true, minlength: 1, maxlength: 100 },
      screen: { 
        type: Number, 
        required: true,
        min: 1,
        max: 8,
        set: v => (v === undefined || v === null ? v : Math.round(v)),
        validate: {
          validator: Number.isInteger,
          message: "screen must be an integer"
        }
      },
      color: {
        type: String,
        match: /^#([0-9A-F]{3}){1,2}$/i,
        default: "#9142ff",
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
      index: { 
        type: Number, 
        required: true,
        set: v => (v === undefined || v === null ? v : Math.round(v)),
        validate: {
          validator: Number.isInteger,
          message: "index must be an integer"
        }
      },
      name: { type: String, required: true, minlength: 1, maxlength: 100 },
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

presentationSchema.pre("save", function (next) {
  const validationError = new mongoose.Error.ValidationError(this)

  for (const cue of this.cues) {
    if (cue.index < 0 || cue.index >= this.indexCount) {
      validationError.addError("cues.index", new mongoose.Error.ValidatorError({
        message: `Cue index ${cue.index} exceeds indexCount`,
        path: "cues.index",
        value: cue.index,
      }))
    }
    if (cue.screen < 1 || cue.screen > this.screenCount) {
      validationError.addError("cues.screen", new mongoose.Error.ValidatorError({
        message: `Cue screen ${cue.screen} exceeds screenCount`,
        path: "cues.screen",
        value: cue.screen,
      }))
    }
  }
  
  for (const audioCue of this.audioCues) {
    if (audioCue.index < 0 || audioCue.index >= this.indexCount) {
      validationError.addError("audioCues.index", new mongoose.Error.ValidatorError({
        message: `Audio cue index ${audioCue.index} exceeds indexCount`,
        path: "audioCues.index",
        value: audioCue.index,
      }))
    }
  }

  if (Object.keys(validationError.errors).length > 0) {
    return next(validationError)
  }
  
  next()
})


presentationSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model("Presentation", presentationSchema)
