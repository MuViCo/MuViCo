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
      index: { type: Number, required: true, },
      name: { type: String, required: true, },
      screen: { type: Number, required: true, },
      file: {
        id: String,
        name: String,
        url: String,
        size: {type: String, default: "0"},
        type: {type: String, default: "image/jpeg"}
      },
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
