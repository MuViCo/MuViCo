/*
 * Backfill of the presentation media library from cue files.
 *
 * Presentations created before the library existed carry their media only
 * inside `cues[].file`, so the editor's media pool shows nothing for them even
 * though the objects are in storage. This rebuilds `media[]` from those cue
 * files.
 *
 * It is safe to rebuild rather than move: a library entry and a cue created
 * from it deliberately share one `id`, hence one storage key. Adding the entry
 * therefore describes what is already stored -- it does not copy or move a
 * single byte, and the cue keeps working untouched.
 *
 * Pure functions only, no database access: the script in ../scripts owns the
 * connection, so the decisions below can be unit-tested against plain objects.
 */

const DEFAULT_MIME_TYPE = "image/jpeg"
const DEFAULT_SIZE = "0"

/**
 * Builds a library entry from a cue's stored file metadata.
 *
 * `url` is deliberately omitted: it is a presigned URL regenerated on every
 * read, and a cue's persisted copy of it is usually stale already.
 */
const entryFromCueFile = (file, createdAt) => ({
  id: file.id,
  name: file.name || `file-${file.id}`,
  type: file.type || DEFAULT_MIME_TYPE,
  size: file.size || DEFAULT_SIZE,
  ...(file.driveId ? { driveId: file.driveId } : {}),
  createdAt,
})

/**
 * Returns the entries missing from one presentation's library, plus counters.
 *
 * Cues that share a file id -- which is what happens when the same pooled
 * media was dropped on several rows -- collapse into a single entry.
 */
const backfillPresentationMedia = (presentation) => {
  const cues = Array.isArray(presentation.cues) ? presentation.cues : []
  const media = Array.isArray(presentation.media) ? presentation.media : []

  const knownIds = new Set(media.map((item) => item.id).filter(Boolean))
  const createdAt = presentation.createdAt || presentation.lastUsed || undefined

  const addedEntries = []
  let cuesWithFile = 0
  let cuesAlreadyInLibrary = 0
  let cuesSharingAddedId = 0

  for (const cue of cues) {
    const file = cue?.file
    if (!file?.id) {
      continue
    }

    cuesWithFile += 1

    if (knownIds.has(file.id)) {
      // Either already in the library, or a second cue pointing at an entry
      // this same run just added.
      if (addedEntries.some((entry) => entry.id === file.id)) {
        cuesSharingAddedId += 1
      } else {
        cuesAlreadyInLibrary += 1
      }
      continue
    }

    knownIds.add(file.id)
    addedEntries.push(entryFromCueFile(file, createdAt))
  }

  return {
    presentationId: presentation._id,
    media: [...media, ...addedEntries],
    addedEntries,
    changed: addedEntries.length > 0,
    counts: {
      cues: cues.length,
      cuesWithFile,
      cuesAlreadyInLibrary,
      cuesSharingAddedId,
      mediaBefore: media.length,
      mediaAdded: addedEntries.length,
      driveEntries: addedEntries.filter((entry) => entry.driveId).length,
    },
  }
}

const summarizeBackfill = (results) =>
  results.reduce(
    (summary, result) => {
      summary.presentations += 1
      if (result.changed) {
        summary.presentationsChanged += 1
      }
      summary.cues += result.counts.cues
      summary.cuesWithFile += result.counts.cuesWithFile
      summary.cuesAlreadyInLibrary += result.counts.cuesAlreadyInLibrary
      summary.cuesSharingAddedId += result.counts.cuesSharingAddedId
      summary.mediaBefore += result.counts.mediaBefore
      summary.mediaAdded += result.counts.mediaAdded
      summary.driveEntries += result.counts.driveEntries
      return summary
    },
    {
      presentations: 0,
      presentationsChanged: 0,
      cues: 0,
      cuesWithFile: 0,
      // Cue files that were already represented in the library before this run.
      cuesAlreadyInLibrary: 0,
      // Extra cues pointing at an entry this run added -- i.e. media reused
      // across rows, which collapses into one entry rather than several.
      cuesSharingAddedId: 0,
      mediaBefore: 0,
      mediaAdded: 0,
      driveEntries: 0,
    }
  )

module.exports = {
  entryFromCueFile,
  backfillPresentationMedia,
  summarizeBackfill,
}
