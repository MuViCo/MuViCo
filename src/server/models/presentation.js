/*presentation.js - Mongoose schema for presentation data
  * This schema defines the structure of presentation documents 
    in the MongoDB database.
  * Each presentation has a name, associated user, storage type, 
    screen count, index count, and array of cues that includes both visual and audio cues.
  * Cues contain information about their index, 
    name, associated media file, loop setting, and color (for cues).
  * The schema also includes a toJSON transformation to format 
    the output when converting documents to JSON.
  * This file is used by the presentation controller and routes 
    to interact with the database when creating, updating, retrieving, 
    and deleting presentations and their cues.
*/

const mongoose = require("mongoose")
const {
  VALID_CUE_TYPES,
  getAudioRow,
  getCueTypeFromScreen,
  getMaxLayers,
} = require("../utils/cueType")

const normalizeCueLayer = (layer, cueType, repairInvalid) => {
  if (layer === undefined || layer === null) {
    return 0
  }
  const parsedLayer = Number(layer ?? 0)
  const isValidLayer =
    Number.isInteger(parsedLayer) &&
    parsedLayer >= 0 &&
    parsedLayer < getMaxLayers(cueType)

  if (isValidLayer) {
    return parsedLayer
  }

  return repairInvalid ? 0 : layer
}

const normalizeCueOpacity = (opacity, repairInvalid) => {
  if (opacity === undefined || opacity === null) {
    return 1
  }
  const parsedOpacity = Number(opacity ?? 1)
  const isValidOpacity =
    Number.isFinite(parsedOpacity) && parsedOpacity >= 0 && parsedOpacity <= 1

  if (isValidOpacity) {
    return parsedOpacity
  }

  return repairInvalid ? 1 : opacity
}

const normalizePresentationCues = (presentationObject, options = {}) => {
  const screenCount = Number(presentationObject.screenCount) || 1
  presentationObject.screenCount = screenCount
  presentationObject.indexCount = Number(presentationObject.indexCount) || 5
  const cues = Array.isArray(presentationObject.cues)
    ? presentationObject.cues
    : []
  presentationObject.cues = cues.map((cue) => {
    const normalizedCue =
      cue && typeof cue.toObject === "function" ? cue.toObject() : { ...cue }

    // Determine cueType: use stored type if valid, otherwise infer from screen
    const cueType = VALID_CUE_TYPES.includes(normalizedCue.cueType)
      ? normalizedCue.cueType
      : getCueTypeFromScreen(normalizedCue.screen, screenCount)

    return {
      ...normalizedCue,
      cueType,
      layer: normalizeCueLayer(
        normalizedCue.layer,
        cueType,
        options.repairInvalid === true
      ),
      opacity: normalizeCueOpacity(
        normalizedCue.opacity,
        options.repairInvalid === true
      ),
      continuePlayback: normalizedCue.continuePlayback ?? false,
      ...(cueType === "audio" ? { screen: getAudioRow(screenCount) } : {}),
    }
  })
}

// Define the presentation schema with all required fields and validation
const presentationSchema = mongoose.Schema(
  {
    // Presentation title
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
    },

    // Optional longer description of the presentation
    description: {
      type: String,
      maxlength: 500,
    },

    // Reference to the User who owns this presentation
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Where media files are stored: AWS S3 or Google Drive
    storage: {
      type: String,
      required: true,
      default: "aws",
      enum: {
        values: ["aws", "googleDrive"],
        message: "storage must be either aws or googleDrive",
      },
    },

    // Number of display screens (1-8). Determines valid cue positions and audio cue row
    screenCount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 8,
      set: (v) => (v === undefined || v === null ? v : Math.round(v)),
      validate: {
        validator: Number.isInteger,
        message: "screenCount must be an integer",
      },
    },

    // Number of index positions (1-101) for the cue timeline
    indexCount: {
      type: Number,
      default: 5,
      min: 1,
      max: 101,
      set: (v) => (v === undefined || v === null ? v : Math.round(v)),
      validate: {
        validator: Number.isInteger,
        message: "indexCount must be an integer",
      },
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
          set: (v) => (v === undefined || v === null ? v : Math.round(v)),
          validate: {
            validator: Number.isInteger,
            message: "index must be an integer",
          },
        },
        name: { type: String, default: "", maxlength: 100 },
        screen: {
          type: Number,
          required: true,
          min: 1,
          set: (v) => (v === undefined || v === null ? v : Math.round(v)),
          validate: {
            validator: Number.isInteger,
            message: "screen must be an integer",
          },
        },
        // Screens a visual cue's image spans across (in addition to `screen`,
        // its primary/grid position). Undefined or a single-element array
        // means "no span". Range/membership/cueType are checked in the
        // pre("save") hook below, where screenCount is available.
        spanScreens: {
          type: [Number],
          default: undefined,
          set: (v) =>
            Array.isArray(v) ? v.map((n) => Math.round(Number(n))) : v,
        },
        // Hex color code for visual cues
        color: {
          type: String,
          match: /^#([0-9A-F]{3}){1,2}$/i,
          default: "#000000",
        },
        // Media file metadata
        file: {
          id: String,
          name: String,
          url: String,
          driveId: String,
          thumbnailId: String,
          thumbnailDriveId: String,
          size: { type: String, default: "0" },
          type: { type: String, default: "image/jpeg" },
        },
        loop: { type: Boolean, default: false },
        continuePlayback: { type: Boolean, default: false },
        opacity: {
          type: Number,
          default: 1,
          min: 0,
          max: 1,
        },
        layer: {
          type: Number,
          default: 0,
          min: 0,
          set: (v) => (v === undefined || v === null ? v : Math.round(v)),
          validate: {
            validator: Number.isInteger,
            message: "layer must be an integer",
          },
        },
      },
    ],
    // Presentation-scoped media library (the editor's "media pool"). Entries
    // are uploaded on their own, independently of any cue, which is what lets
    // the pool survive a page reload -- cue-embedded files never could.
    //
    // A cue created from a library entry reuses that entry's `id`, so cue and
    // entry address the SAME storage object (`${presentationId}/${id}`); no
    // copy is made. The deletion guards in routes/presentation.js are what keep
    // that sharing safe. Absent on every pre-existing document, where it reads
    // back as [] and no guard ever fires -- so legacy behaviour is unchanged.
    media: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true, maxlength: 255 },
        // Transient, exactly like cue.file.url: overwritten with a fresh
        // presigned URL on every read. Never trust a persisted value.
        url: String,
        driveId: String,
        size: { type: String, default: "0" },
        type: { type: String, default: "image/jpeg" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    scores: [
      {
        title: {
          type: String,
          required: true,
          minlength: 1,
          maxlength: 150,
        },
        source: {
          type: String,
          required: true,
          default: "upload",
          enum: {
            values: ["upload", "imslp"],
            message: "source must be either upload or imslp",
          },
        },
        sourceUrl: {
          type: String,
          maxlength: 1000,
        },
        imslpId: {
          type: String,
          maxlength: 80,
        },
        pageCount: {
          type: Number,
          min: 1,
          set: (v) => (v === undefined || v === null ? v : Math.round(v)),
          validate: {
            validator: (v) => v === undefined || Number.isInteger(v),
            message: "pageCount must be an integer",
          },
        },
        file: {
          id: String,
          name: String,
          url: String,
          proxyUrl: String,
          driveId: String,
          size: { type: String, default: "0" },
          type: { type: String, default: "application/pdf" },
        },
        markers: [
          {
            page: {
              type: Number,
              required: true,
              min: 1,
              set: (v) => (v === undefined || v === null ? v : Math.round(v)),
              validate: {
                validator: Number.isInteger,
                message: "marker page must be an integer",
              },
            },
            frameIndex: {
              type: Number,
              required: true,
              min: 0,
              set: (v) => (v === undefined || v === null ? v : Math.round(v)),
              validate: {
                validator: Number.isInteger,
                message: "marker frameIndex must be an integer",
              },
            },
            measureLabel: {
              type: String,
              default: "",
              maxlength: 80,
            },
            note: {
              type: String,
              default: "",
              maxlength: 300,
            },
            rect: {
              x: { type: Number, min: 0, max: 1 },
              y: { type: Number, min: 0, max: 1 },
              width: { type: Number, min: 0, max: 1 },
              height: { type: Number, min: 0, max: 1 },
            },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
)

presentationSchema.index({ user: 1, lastUsed: -1 })

presentationSchema.pre("validate", function (next) {
  normalizePresentationCues(this)
  next()
})

presentationSchema.pre("save", function (next) {
  const validationError = new mongoose.Error.ValidationError(this)

  for (const cue of this.cues) {
    if (cue.index < 0 || cue.index >= this.indexCount) {
      validationError.addError(
        "cues.index",
        new mongoose.Error.ValidatorError({
          message: `Cue index ${cue.index} exceeds indexCount`,
          path: "cues.index",
          value: cue.index,
        })
      )
    }

    if (!VALID_CUE_TYPES.includes(cue.cueType)) {
      validationError.addError(
        "cues.cueType",
        new mongoose.Error.ValidatorError({
          message: `Invalid cueType ${cue.cueType}`,
          path: "cues.cueType",
          value: cue.cueType,
        })
      )
    }

    if (
      cue.cueType === "audio" &&
      cue.screen !== getAudioRow(this.screenCount)
    ) {
      validationError.addError(
        "cues.screen",
        new mongoose.Error.ValidatorError({
          message: `Audio cue screen ${cue.screen} must equal screenCount + 1`,
          path: "cues.screen",
          value: cue.screen,
        })
      )
    }

    if (
      cue.cueType === "visual" &&
      (cue.screen < 1 || cue.screen > this.screenCount)
    ) {
      validationError.addError(
        "cues.screen",
        new mongoose.Error.ValidatorError({
          message: `Visual cue screen ${cue.screen} exceeds screenCount`,
          path: "cues.screen",
          value: cue.screen,
        })
      )
    }

    const layer = Number(cue.layer ?? 0)
    const maxLayers = getMaxLayers(cue.cueType)
    if (layer < 0 || layer >= maxLayers) {
      validationError.addError(
        "cues.layer",
        new mongoose.Error.ValidatorError({
          message: `Cue layer ${layer} out of range (0..${maxLayers - 1})`,
          path: "cues.layer",
          value: layer,
        })
      )
    }

    if (cue.spanScreens !== undefined) {
      const spanScreens = cue.spanScreens || []
      const isValidSpan =
        cue.cueType === "visual" &&
        spanScreens.length > 1 &&
        spanScreens.includes(cue.screen) &&
        new Set(spanScreens).size === spanScreens.length &&
        spanScreens.every(
          (screenNumber) =>
            Number.isInteger(screenNumber) &&
            screenNumber >= 1 &&
            screenNumber <= this.screenCount
        )

      if (!isValidSpan) {
        validationError.addError(
          "cues.spanScreens",
          new mongoose.Error.ValidatorError({
            message: `Cue spanScreens ${JSON.stringify(spanScreens)} is invalid for screen ${cue.screen}, cueType ${cue.cueType}, screenCount ${this.screenCount}`,
            path: "cues.spanScreens",
            value: cue.spanScreens,
          })
        )
      }
    }
  }

  for (const score of this.scores || []) {
    for (const marker of score.markers || []) {
      if (marker.frameIndex < 0 || marker.frameIndex >= this.indexCount) {
        validationError.addError(
          "scores.markers.frameIndex",
          new mongoose.Error.ValidatorError({
            message: `Score marker frameIndex ${marker.frameIndex} exceeds indexCount`,
            path: "scores.markers.frameIndex",
            value: marker.frameIndex,
          })
        )
      }

      if (
        score.pageCount &&
        marker.page &&
        Number(marker.page) > Number(score.pageCount)
      ) {
        validationError.addError(
          "scores.markers.page",
          new mongoose.Error.ValidatorError({
            message: `Score marker page ${marker.page} exceeds pageCount`,
            path: "scores.markers.page",
            value: marker.page,
          })
        )
      }
    }
  }

  if (Object.keys(validationError.errors).length > 0) {
    return next(validationError)
  }

  next()
})

// Transform document when converting to JSON: format IDs and extract audio cues
presentationSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    normalizePresentationCues(returnedObject, { repairInvalid: true })
    returnedObject.audioCues = returnedObject.cues.filter(
      (cue) => cue.cueType === "audio"
    )
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model("Presentation", presentationSchema)
