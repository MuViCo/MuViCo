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
const { VALID_CUE_TYPES, getAudioRow, getCueTypeFromScreen } = require("../utils/cueType")

const normalizePresentationCues = (presentationObject) => {
  const screenCount = Number(presentationObject.screenCount) || 1
  const cues = Array.isArray(presentationObject.cues) ? presentationObject.cues : []
  presentationObject.cues = cues.map((cue) => {
    const normalizedCue = cue && typeof cue.toObject === "function"
      ? cue.toObject()
      : { ...cue }

    const cueType = VALID_CUE_TYPES.includes(normalizedCue.cueType)
      ? normalizedCue.cueType
      : getCueTypeFromScreen(normalizedCue.screen, screenCount)

    const parsedDuration = Number(normalizedCue.duration)
    const duration = Number.isInteger(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : 1

    return {
      ...normalizedCue,
      cueType,
      duration,
      ...(cueType === "audio" ? { screen: getAudioRow(screenCount) } : {}),
    }
  })
}

const presentationSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
  },

  description: {
    type: String,
    maxlength: 500,
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

  lastUsed: {
    type: Date,
    default: Date.now,
    index: -1,
  },

  cues: [
    {
      cueType: {
        type: String,
        required: true,
        enum: {
          values: VALID_CUE_TYPES,
          message: "cueType must be either visual or audio",
        },
      },
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
        set: v => (v === undefined || v === null ? v : Math.round(v)),
        validate: {
          validator: Number.isInteger,
          message: "screen must be an integer"
        }
      },
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
      duration: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
        max: 101,
        set: v => (v === undefined || v === null ? v : Math.round(v)),
        validate: {
          validator: Number.isInteger,
          message: "duration must be an integer"
        }
      },
    },
  ],

}, { timestamps: true })

presentationSchema.index({ user: 1, lastUsed: -1 })

presentationSchema.pre("validate", function (next) {
  normalizePresentationCues(this)
  next()
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

    if (!VALID_CUE_TYPES.includes(cue.cueType)) {
      validationError.addError("cues.cueType", new mongoose.Error.ValidatorError({
        message: `Invalid cueType ${cue.cueType}`,
        path: "cues.cueType",
        value: cue.cueType,
      }))
    }

    if (cue.cueType === "audio" && cue.screen !== getAudioRow(this.screenCount)) {
      validationError.addError("cues.screen", new mongoose.Error.ValidatorError({
        message: `Audio cue screen ${cue.screen} must equal screenCount + 1`,
        path: "cues.screen",
        value: cue.screen,
      }))
    }

    if (cue.cueType === "visual" && (cue.screen < 1 || cue.screen > this.screenCount)) {
      validationError.addError("cues.screen", new mongoose.Error.ValidatorError({
        message: `Visual cue screen ${cue.screen} exceeds screenCount`,
        path: "cues.screen",
        value: cue.screen,
      }))
    }

    const duration = Number(cue.duration) || 1
    const cueEndIndex = cue.index + duration - 1
    if (cueEndIndex >= this.indexCount) {
      validationError.addError("cues.duration", new mongoose.Error.ValidatorError({
        message: `Cue span ${cue.index}-${cueEndIndex} exceeds indexCount`,
        path: "cues.duration",
        value: duration,
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
    normalizePresentationCues(returnedObject)
    returnedObject.audioCues = returnedObject.cues.filter((cue) => cue.cueType === "audio")
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },

})

module.exports = mongoose.model("Presentation", presentationSchema)
