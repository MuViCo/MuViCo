const mongoose = require("mongoose")
const config = require("../utils/config")
const {
  normalizePresentation,
  summarizeMigration,
} = require("../utils/legacyPresentationMigration")

const shouldApply = process.argv.includes("--apply")

const main = async () => {
  const uri = process.env.MONGODB_URI || config.MONGODB_URI
  await mongoose.connect(uri)

  const presentations = mongoose.connection.collection("presentations")
  const documents = await presentations.find({}).toArray()
  const results = documents.map(normalizePresentation)
  const summary = summarizeMigration(results)

  if (shouldApply && summary.duplicateSlots > 0) {
    throw new Error(
      "Refusing to apply migration while duplicate normalized slots exist"
    )
  }

  if (shouldApply) {
    const operations = results
      .filter((result) => result.changed)
      .map((result) => ({
        updateOne: {
          filter: { _id: result.presentation._id },
          update: { $set: { cues: result.presentation.cues } },
        },
      }))

    if (operations.length > 0) {
      const writeResult = await presentations.bulkWrite(operations, {
        ordered: false,
      })
      summary.modifiedCount = writeResult.modifiedCount
      summary.matchedCount = writeResult.matchedCount
    } else {
      summary.modifiedCount = 0
      summary.matchedCount = 0
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "dry-run",
        ...summary,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
