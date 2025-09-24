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
    max: 4,
  },

  cues: [
    {
      index: { type: Number, required: true },
      name: { type: String, required: true },
      screen: { type: Number, required: true },
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
