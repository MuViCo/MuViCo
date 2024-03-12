const Presentation = require("../models/presentation")
const User = require("../models/user")

const presentationsInDb = async () => {
  const presentations = await Presentation.find({})
  return presentations.map((presentation) => presentation.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map((user) => user.toJSON())
}

module.exports = {
  presentationsInDb,
  usersInDb,
}
