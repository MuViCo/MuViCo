/*
 * Media library backfill tests.
 * Covers rebuilding media[] from cue files, collapsing cues that share a file,
 * leaving already-migrated presentations alone, and the run summary.
 */
const {
  entryFromCueFile,
  backfillPresentationMedia,
  summarizeBackfill,
} = require("../utils/mediaLibraryBackfill")

const cueWithFile = (file) => ({ _id: "cue", cueType: "visual", file })

describe("entryFromCueFile", () => {
  test("carries the stored metadata across and drops the presigned url", () => {
    const entry = entryFromCueFile(
      {
        id: "file-1",
        name: "photo.png",
        type: "image/png",
        size: "1024",
        url: "https://example.com/expired-signature",
      },
      "2026-01-01"
    )

    expect(entry).toEqual({
      id: "file-1",
      name: "photo.png",
      type: "image/png",
      size: "1024",
      createdAt: "2026-01-01",
    })
  })

  test("falls back to the schema defaults for missing metadata", () => {
    const entry = entryFromCueFile({ id: "file-2" }, undefined)

    expect(entry.name).toBe("file-file-2")
    expect(entry.type).toBe("image/jpeg")
    expect(entry.size).toBe("0")
  })

  test("keeps driveId for Drive-backed files only", () => {
    expect(entryFromCueFile({ id: "a", driveId: "drive-1" }).driveId).toBe(
      "drive-1"
    )
    expect(entryFromCueFile({ id: "b" })).not.toHaveProperty("driveId")
  })
})

describe("backfillPresentationMedia", () => {
  test("adds an entry for a legacy cue whose file is not in the library", () => {
    const result = backfillPresentationMedia({
      _id: "p1",
      createdAt: "2026-01-01",
      cues: [cueWithFile({ id: "file-1", name: "photo.png" })],
    })

    expect(result.changed).toBe(true)
    expect(result.media).toHaveLength(1)
    expect(result.media[0].id).toBe("file-1")
    expect(result.counts.mediaAdded).toBe(1)
  })

  test("collapses cues that share one file into a single entry", () => {
    const result = backfillPresentationMedia({
      _id: "p1",
      cues: [
        cueWithFile({ id: "file-1" }),
        cueWithFile({ id: "file-1" }),
        cueWithFile({ id: "file-2" }),
      ],
    })

    expect(result.media.map((item) => item.id)).toEqual(["file-1", "file-2"])
    expect(result.counts.cuesWithFile).toBe(3)
    expect(result.counts.cuesSharingAddedId).toBe(1)
  })

  test("leaves a presentation whose library is already complete unchanged", () => {
    const result = backfillPresentationMedia({
      _id: "p1",
      cues: [cueWithFile({ id: "file-1" })],
      media: [{ id: "file-1", name: "photo.png" }],
    })

    expect(result.changed).toBe(false)
    expect(result.media).toHaveLength(1)
    expect(result.counts.cuesAlreadyInLibrary).toBe(1)
  })

  test("appends to a partially filled library without touching what is there", () => {
    const existing = { id: "file-1", name: "kept.png" }
    const result = backfillPresentationMedia({
      _id: "p1",
      cues: [cueWithFile({ id: "file-1" }), cueWithFile({ id: "file-2" })],
      media: [existing],
    })

    expect(result.media[0]).toBe(existing)
    expect(result.media.map((item) => item.id)).toEqual(["file-1", "file-2"])
  })

  test("ignores colour-only cues, which carry no file", () => {
    const result = backfillPresentationMedia({
      _id: "p1",
      cues: [{ _id: "cue", cueType: "visual", file: null }, cueWithFile({})],
    })

    expect(result.changed).toBe(false)
    expect(result.counts.cuesWithFile).toBe(0)
  })

  test("tolerates a document with no cues array at all", () => {
    const result = backfillPresentationMedia({ _id: "p1" })

    expect(result.changed).toBe(false)
    expect(result.media).toEqual([])
  })
})

describe("summarizeBackfill", () => {
  test("totals the per-presentation counters", () => {
    const summary = summarizeBackfill([
      backfillPresentationMedia({
        _id: "p1",
        cues: [cueWithFile({ id: "a" }), cueWithFile({ id: "a" })],
      }),
      backfillPresentationMedia({
        _id: "p2",
        cues: [cueWithFile({ id: "b", driveId: "drive-1" })],
      }),
      backfillPresentationMedia({ _id: "p3", cues: [] }),
    ])

    expect(summary.presentations).toBe(3)
    expect(summary.presentationsChanged).toBe(2)
    expect(summary.cuesWithFile).toBe(3)
    expect(summary.mediaAdded).toBe(2)
    expect(summary.cuesSharingAddedId).toBe(1)
    expect(summary.driveEntries).toBe(1)
  })
})
