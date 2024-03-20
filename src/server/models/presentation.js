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

  cues: [
    {
      index: Number,
      name: String,
      screen: Number,
      fileName: String,
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  ],

  files: [
    {
      name: String,
      url: String,
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
