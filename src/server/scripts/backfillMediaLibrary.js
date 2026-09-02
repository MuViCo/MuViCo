/*
 * Rebuilds every presentation's media library from its cue files.
 *
 * Dry-run by default -- it reports what it would write and touches nothing.
 * Pass --apply to write.
 *
 *   node src/server/scripts/backfillMediaLibrary.js
 *   node src/server/scripts/backfillMediaLibrary.js --apply
 *
 * MONGODB_URI overrides the configured connection, which is how the same
 * command is pointed at a staging database for a dry-run.
 */

const mongoose = require("mongoose")
const config = require("../utils/config")
const {
  backfillPresentationMedia,
  summarizeBackfill,
} = require("../utils/mediaLibraryBackfill")

const shouldApply = process.argv.includes("--apply")

const main = async () => {
  const uri = process.env.MONGODB_URI || config.MONGODB_URI
  await mongoose.connect(uri)

  // The raw collection, not the model: this must read documents exactly as
  // stored, without the schema's defaults and normalisation hooks rewriting
  // them on the way in or out.
  const presentations = mongoose.connection.collection("presentations")
  const documents = await presentations.find({}).toArray()
  const results = documents.map(backfillPresentationMedia)
  const summary = summarizeBackfill(results)

  if (shouldApply) {
    const operations = results
      .filter((result) => result.changed)
      .map((result) => ({
        updateOne: {
          filter: { _id: result.presentationId },
          update: { $set: { media: result.media } },
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
      { mode: shouldApply ? "apply" : "dry-run", ...summary },
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
