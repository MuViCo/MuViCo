/**
 * This module defines the routes for managing presentations, including:
 * retrieving presentation details, updating presentation properties (like index and screen count), uploading and managing cues (which can be files or colors associated with specific screens and indices), and deleting presentations.
 * It uses multer for handling file uploads, integrates with AWS S3 and Google Drive for file storage, and includes middleware for user authentication and presentation access control.
 * The routes interact with the Presentation model to perform CRUD operations and ensure that users can only access and modify presentations they have permissions for.
 * The module also includes error handling for various edge cases, such as file size limits, invalid input data, and conflicts in cue positioning.
 */
import express, { type Response } from "express"
import multer from "multer"
import crypto from "crypto"

import { uploadFileS3, deleteFileS3, getObjectStreamS3 } from "../utils/s3"
import {
  uploadDriveFile,
  deleteDriveFile,
  getDriveFileStream,
  getDriveFileMetadata,
  getDriveFileBuffer,
} from "../utils/drive"
import Presentation from "../models/presentation"
import User from "../models/user"
import {
  userExtractor,
  requirePresentationAccess,
  requireSharedPresentationAccess,
} from "../utils/middleware"
import { BUCKET_NAME } from "../utils/config"
import {
  generateSignedUrlForS3,
  processS3Files,
  processS3MediaFiles,
  processDriveCueFiles,
  processDriveMediaFiles,
  processS3ScoreFiles,
  processDriveScoreFiles,
} from "../utils/helper"
import {
  getAudioRow,
  getCueTypeFromScreen,
  getMaxLayers,
  isAudioMimeType,
  isImageMimeType,
  isAllowedMimeType,
} from "../utils/cueType"
import * as logger from "../utils/logger"
import { isValidAspectRatio } from "../../constants.js"
import type {
  Cue,
  CueFile,
  CueFrame,
  CueType,
  PresentationDocument,
  Score,
  ScoreMarker,
  SpanFill,
  SpanPosition,
  UserDocument,
} from "../types"

// Mongoose gives hydrated array-of-subdocument fields .id()/.pull() etc,
// but only when the doc type comes from its own schema inference -- our
// hand-written PresentationAttrs doesn't get that for free. Casting once
// here beats casting at every call site below.
type ScoreSubdocument = Score & {
  markers: (ScoreMarker & {
    set: (value: Partial<ScoreMarker>) => void
    deleteOne: () => void
  })[] & {
    id: (id: unknown) =>
      | (ScoreMarker & {
          set: (value: Partial<ScoreMarker>) => void
          deleteOne: () => void
        })
      | null
  }
  deleteOne: () => void
}

const findScore = (
  presentation: PresentationDocument,
  scoreId: unknown
): ScoreSubdocument | null =>
  // @ts-expect-error -- .id() exists at runtime, not on the Score[] type
  presentation.scores.id(scoreId)

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage })
const PDF_MIME_TYPES = ["application/pdf", "application/x-pdf"]
const MAX_SCORE_FILE_SIZE = 50 * 1024 * 1024

const generateFileId = () => crypto.randomBytes(8).toString("hex")

const parseOptionalPositiveInteger = (rawValue: unknown) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined
  }

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value < 1) {
    return null
  }

  return value
}

const parseMarkerInteger = (rawValue: unknown) => {
  const value = Number(rawValue)
  return Number.isInteger(value) ? value : null
}

const isPdfFile = (file: Express.Multer.File | undefined) => {
  if (!file) {
    return false
  }

  return (
    PDF_MIME_TYPES.includes(file.mimetype) ||
    file.originalname.toLowerCase().endsWith(".pdf")
  )
}

const trimText = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback

const validateScoreTitle = (title: unknown) => {
  const trimmedTitle = trimText(title)
  if (trimmedTitle.length === 0 || trimmedTitle.length > 150) {
    return null
  }

  return trimmedTitle
}

const safeInlineFilename = (name: unknown) => {
  const fallback = "score.pdf"
  const filename = trimText(name, fallback).replace(/["\\\r\n]/g, "_")
  return filename || fallback
}

const setScoreFileHeaders = (
  res: Response,
  score: Score,
  contentType?: string,
  contentLength?: number
) => {
  const filename = safeInlineFilename(score.file?.name || score.title)
  res.setHeader(
    "Content-Type",
    contentType || score.file?.type || "application/pdf"
  )
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  )
  res.setHeader("Cache-Control", "private, max-age=300")
  if (contentLength !== undefined) {
    res.setHeader("Content-Length", contentLength)
  }
}

const streamS3ScoreFile = async (
  res: Response,
  presentation: PresentationDocument,
  score: Score
) => {
  if (!score.file?.id) {
    return res.status(404).json({ error: "Score file not found" })
  }

  const key = `${presentation._id}/${score.file.id}`
  const response = await getObjectStreamS3(key)

  if (
    !response.Body ||
    typeof (response.Body as { pipe?: unknown }).pipe !== "function"
  ) {
    return res.status(404).json({ error: "Score file not found" })
  }

  setScoreFileHeaders(res, score, response.ContentType, response.ContentLength)
  return (response.Body as unknown as NodeJS.ReadableStream).pipe(res)
}

const parseUrl = (rawUrl: unknown) => {
  const sourceUrl = trimText(rawUrl)
  if (!sourceUrl) {
    return null
  }

  try {
    const url = new URL(sourceUrl)
    if (!["http:", "https:"].includes(url.protocol)) {
      return null
    }

    return url
  } catch {
    return null
  }
}

const isImslpUrl = (url: URL) =>
  url.hostname === "imslp.org" || url.hostname.endsWith(".imslp.org")

const parseMarkerRect = (rawRect: unknown) => {
  if (rawRect === undefined || rawRect === null || rawRect === "") {
    return undefined
  }

  const rect = typeof rawRect === "string" ? JSON.parse(rawRect) : rawRect
  const keys = ["x", "y", "width", "height"] as const
  const parsed: { x?: number; y?: number; width?: number; height?: number } = {}

  for (const key of keys) {
    if (rect[key] === undefined || rect[key] === null || rect[key] === "") {
      continue
    }

    const value = Number(rect[key])
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      return null
    }

    parsed[key] = value
  }

  return parsed
}

const processPresentationScoreFiles = async (
  presentation: PresentationDocument,
  user: UserDocument
) => {
  if (user.driveToken) {
    presentation.scores = await processDriveScoreFiles(
      presentation.scores || [],
      user.driveToken
    )
  } else {
    presentation.scores = await processS3ScoreFiles(
      presentation.scores || [],
      presentation._id
    )
  }

  return presentation
}

const uploadScoreFile = async (
  presentationId: unknown,
  fileId: string,
  file: Express.Multer.File,
  user: UserDocument
) => {
  const key = `${presentationId}/${fileId}`

  if (user.driveToken) {
    return uploadDriveFile(file.buffer, key, file.mimetype, user.driveToken)
  }

  await uploadFileS3(file.buffer, key, file.mimetype)
  return null
}

const deleteScoreFile = async (
  presentationId: unknown,
  score: Score,
  user: UserDocument
) => {
  if (!score.file) {
    return
  }

  if (user.driveToken && score.file.driveId) {
    await deleteDriveFile(score.file.driveId, user.driveToken)
    return
  }

  if (score.file.id) {
    await deleteFileS3(`${presentationId}/${score.file.id}`)
  }
}

const parseCueOpacity = (rawOpacity: unknown, fallback: number | undefined) => {
  if (rawOpacity === undefined || rawOpacity === null || rawOpacity === "") {
    return fallback
  }

  const opacity = Number(rawOpacity)
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    return null
  }

  return opacity
}

// A cue's occupied screens: spanScreens when it's a valid multi-screen span,
// otherwise just its own primary screen.
const snapshotDriveFilesToS3 = async (
  presentation: PresentationDocument,
  driveToken: string
) => {
  const files: Array<{ id?: string; driveId?: string; type?: string }> = []

  for (const cue of presentation.cues) {
    if (cue.file?.driveId) files.push(cue.file)
  }
  for (const item of presentation.media || []) {
    if (item.driveId) files.push(item)
  }
  for (const score of presentation.scores || []) {
    if (score.file?.driveId) files.push(score.file)
  }

  for (const file of files) {
    if (!file.id || !file.driveId) continue

    const metadata = await getDriveFileMetadata(file.driveId, driveToken)
    const buffer = await getDriveFileBuffer(file.driveId, driveToken)

    await uploadFileS3(
      buffer,
      `${presentation._id}/${file.id}`,
      (metadata.mimeType as string) || file.type || "application/octet-stream"
    )
  }

  return files.length
}

const storesOnDrive = (
  presentation: PresentationDocument,
  user: UserDocument
): boolean => presentation.storage === "googleDrive" && Boolean(user.driveToken)

const occupiedScreens = (
  screen: unknown,
  spanScreens: number[] | null | undefined
) =>
  Array.isArray(spanScreens) && spanScreens.length > 1
    ? spanScreens
    : [Number(screen)]

// Parses the `spanScreens` form field (a JSON-encoded array of screen
// numbers, or absent/empty for "no span"). Range/membership/cueType checks
// happen at the call site, where `screen`, `cueType` and `screenCount` are
// known -- this only handles shape.
const parseSpanScreens = (
  raw: unknown
): { spanScreens: number[] | null; error: string | null } => {
  if (raw === undefined || raw === null || raw === "") {
    return { spanScreens: null, error: null }
  }

  let parsed
  try {
    parsed = JSON.parse(raw as string)
  } catch {
    return { spanScreens: null, error: "spanScreens must be valid JSON" }
  }

  if (!Array.isArray(parsed)) {
    return { spanScreens: null, error: "spanScreens must be an array" }
  }
  if (parsed.length === 0) {
    return { spanScreens: null, error: null }
  }

  const normalized = parsed.map(Number)
  if (normalized.some((screenNumber) => !Number.isInteger(screenNumber))) {
    return {
      spanScreens: null,
      error: "spanScreens must contain only integers",
    }
  }

  return { spanScreens: normalized, error: null }
}

const SPAN_FILLS: SpanFill[] = ["cover", "contain"]
const SPAN_POSITIONS: SpanPosition[] = [
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
]

// How a spanned cue is framed. Absent leaves the cue's own value alone; an
// empty string clears it back to the client's default.
const parseSpanFraming = (
  body: Record<string, unknown>
): {
  // undefined = not in this request, null = clear it, a value = set it.
  spanFill: SpanFill | null | undefined
  spanPosition: SpanPosition | null | undefined
  error: string | null
} => {
  const read = <T extends string>(
    field: string,
    allowed: T[]
  ): { value: T | null | undefined; error: string | null } => {
    const raw = body[field]
    if (raw === undefined) return { value: undefined, error: null }
    if (raw === "") return { value: null, error: null }
    if (typeof raw !== "string" || !allowed.includes(raw as T)) {
      return {
        value: undefined,
        error: `${field} must be one of ${allowed.join(", ")}`,
      }
    }
    return { value: raw as T, error: null }
  }

  const fill = read("spanFill", SPAN_FILLS)
  const position = read("spanPosition", SPAN_POSITIONS)

  return {
    spanFill: fill.value,
    spanPosition: position.value,
    error: fill.error || position.error,
  }
}

const parseFrame = (
  raw: unknown
): { frame: CueFrame | null; error: string | null } => {
  if (raw === undefined || raw === null || raw === "") {
    return { frame: null, error: null }
  }

  let parsed
  try {
    parsed = JSON.parse(raw as string)
  } catch {
    return { frame: null, error: "frame must be valid JSON" }
  }

  if (!parsed || typeof parsed !== "object") {
    return { frame: null, error: "frame must be an object" }
  }

  const { x, y, width, height } = parsed as Record<string, unknown>
  const within01 = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1

  if (
    !within01(x) ||
    !within01(y) ||
    !within01(width) ||
    !within01(height) ||
    (width as number) <= 0 ||
    (height as number) <= 0
  ) {
    return {
      frame: null,
      error:
        "frame x/y/width/height must be between 0 and 1, with a positive size",
    }
  }

  return {
    frame: {
      x: x as number,
      y: y as number,
      width: width as number,
      height: height as number,
    },
    error: null,
  }
}

const parseDuration = (
  raw: unknown
): { duration: number | null; error: string | null } => {
  if (raw === undefined || raw === null || raw === "") {
    return { duration: null, error: null }
  }

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return {
      duration: null,
      error: "duration must be an integer of at least 1",
    }
  }

  return { duration: parsed, error: null }
}

const MAX_CUE_TEXT_LENGTH = 500
const MIN_TEXT_SIZE = 1
const MAX_TEXT_SIZE = 100
const HEX_COLOR = /^#([0-9A-F]{3}){1,2}$/i

const TEXT_EFFECTS = ["none", "crawl", "scroll-up", "scroll-down"]
const MIN_TEXT_EFFECT_SPEED = 0.25
const MAX_TEXT_EFFECT_SPEED = 4

const parseCueText = (
  body: Record<string, unknown>
): {
  provided: boolean
  text: string | undefined
  textColor: string | undefined
  textSize: number | undefined
  textEffect: string | undefined
  textEffectSpeed: number | undefined
  textEffectLoop: boolean | undefined
  error: string | null
} => {
  const fail = (error: string) => ({
    provided: true,
    text: undefined,
    textColor: undefined,
    textSize: undefined,
    textEffect: undefined,
    textEffectSpeed: undefined,
    textEffectLoop: undefined,
    error,
  })
  const provided = body.text !== undefined

  if (provided && typeof body.text !== "string") {
    return fail("text must be a string")
  }
  const text = typeof body.text === "string" ? body.text.trim() : undefined
  if (text && text.length > MAX_CUE_TEXT_LENGTH) {
    return fail(`text must be at most ${MAX_CUE_TEXT_LENGTH} characters long`)
  }

  let textColor: string | undefined
  if (body.textColor !== undefined && body.textColor !== "") {
    if (typeof body.textColor !== "string" || !HEX_COLOR.test(body.textColor)) {
      return fail("textColor must be a hex color like #ffffff")
    }
    textColor = body.textColor
  }

  let textSize: number | undefined
  if (body.textSize !== undefined && body.textSize !== "") {
    const parsed = Number(body.textSize)
    if (
      !Number.isFinite(parsed) ||
      parsed < MIN_TEXT_SIZE ||
      parsed > MAX_TEXT_SIZE
    ) {
      return fail(
        `textSize must be a number between ${MIN_TEXT_SIZE} and ${MAX_TEXT_SIZE}`
      )
    }
    textSize = parsed
  }

  let textEffect: string | undefined
  if (body.textEffect !== undefined && body.textEffect !== "") {
    if (!TEXT_EFFECTS.includes(body.textEffect as string)) {
      return fail(`textEffect must be one of ${TEXT_EFFECTS.join(", ")}`)
    }
    textEffect = body.textEffect as string
  }

  let textEffectSpeed: number | undefined
  if (body.textEffectSpeed !== undefined && body.textEffectSpeed !== "") {
    const parsed = Number(body.textEffectSpeed)
    if (
      !Number.isFinite(parsed) ||
      parsed < MIN_TEXT_EFFECT_SPEED ||
      parsed > MAX_TEXT_EFFECT_SPEED
    ) {
      return fail(
        `textEffectSpeed must be a number between ${MIN_TEXT_EFFECT_SPEED} and ${MAX_TEXT_EFFECT_SPEED}`
      )
    }
    textEffectSpeed = parsed
  }

  let textEffectLoop: boolean | undefined
  if (body.textEffectLoop !== undefined && body.textEffectLoop !== "") {
    if (
      !["true", "false", true, false].includes(body.textEffectLoop as never)
    ) {
      return fail("textEffectLoop must be a boolean")
    }
    textEffectLoop =
      body.textEffectLoop === true || body.textEffectLoop === "true"
  }

  return {
    provided,
    text: text || undefined,
    textColor,
    textSize,
    textEffect,
    textEffectSpeed,
    textEffectLoop,
    error: null,
  }
}

const IMAGE_EFFECTS = ["none", "fade"]
const MIN_IMAGE_EFFECT_SPEED = 0.25
const MAX_IMAGE_EFFECT_SPEED = 4

const parseImageEffect = (
  body: Record<string, unknown>
): {
  imageEffect: string | undefined
  imageEffectSpeed: number | undefined
  imageEffectLoop: boolean | undefined
  error: string | null
} => {
  const fail = (error: string) => ({
    imageEffect: undefined,
    imageEffectSpeed: undefined,
    imageEffectLoop: undefined,
    error,
  })

  let imageEffect: string | undefined
  if (body.imageEffect !== undefined && body.imageEffect !== "") {
    if (!IMAGE_EFFECTS.includes(body.imageEffect as string)) {
      return fail(`imageEffect must be one of ${IMAGE_EFFECTS.join(", ")}`)
    }
    imageEffect = body.imageEffect as string
  }

  let imageEffectSpeed: number | undefined
  if (body.imageEffectSpeed !== undefined && body.imageEffectSpeed !== "") {
    const parsed = Number(body.imageEffectSpeed)
    if (
      !Number.isFinite(parsed) ||
      parsed < MIN_IMAGE_EFFECT_SPEED ||
      parsed > MAX_IMAGE_EFFECT_SPEED
    ) {
      return fail(
        `imageEffectSpeed must be a number between ${MIN_IMAGE_EFFECT_SPEED} and ${MAX_IMAGE_EFFECT_SPEED}`
      )
    }
    imageEffectSpeed = parsed
  }

  let imageEffectLoop: boolean | undefined
  if (body.imageEffectLoop !== undefined && body.imageEffectLoop !== "") {
    if (
      !["true", "false", true, false].includes(body.imageEffectLoop as never)
    ) {
      return fail("imageEffectLoop must be a boolean")
    }
    imageEffectLoop =
      body.imageEffectLoop === true || body.imageEffectLoop === "true"
  }

  return { imageEffect, imageEffectSpeed, imageEffectLoop, error: null }
}

// Full validity check once `screen`/`cueType`/`screenCount` are known: must
// be visual, include the cue's own screen, have no duplicates, and every
// entry must be a valid screen number.
const isValidSpanScreens = (
  spanScreens: number[],
  screen: number,
  cueType: CueType,
  screenCount: number
) =>
  cueType === "visual" &&
  spanScreens.length > 1 &&
  spanScreens.includes(screen) &&
  new Set(spanScreens).size === spanScreens.length &&
  spanScreens.every(
    (screenNumber) => screenNumber >= 1 && screenNumber <= screenCount
  )

const hasPositionConflict = (
  cues: Cue[],
  index: number,
  screen: number,
  layer: number | undefined,
  excludedCueId: unknown = null,
  spanScreens: number[] | null = null
) => {
  const candidateScreens = occupiedScreens(screen, spanScreens)

  return cues.some((cue) => {
    if (Number(cue.index) !== Number(index)) {
      return false
    }
    if (Number(cue.layer ?? 0) !== Number(layer ?? 0)) {
      return false
    }

    const samePosition = occupiedScreens(cue.screen, cue.spanScreens).some(
      (occupiedScreen) => candidateScreens.includes(occupiedScreen)
    )
    if (!samePosition) {
      return false
    }

    if (!excludedCueId) {
      return true
    }

    return (
      cue._id.toString() !==
      (excludedCueId as { toString(): string }).toString()
    )
  })
}

// Checks if there is a cue (other than the two being swapped) that already occupies one of the target positions
const hasSwapTargetConflict = (
  cues: Cue[],
  firstCueId: unknown,
  secondCueId: unknown,
  firstTargetIndex: number,
  firstTargetScreen: number,
  firstTargetLayer: number,
  secondTargetIndex: number,
  secondTargetScreen: number,
  secondTargetLayer: number
) => {
  return cues.some((cue) => {
    const cueId = cue._id.toString()

    if (
      cueId === (firstCueId as { toString(): string }).toString() ||
      cueId === (secondCueId as { toString(): string }).toString()
    ) {
      return false
    }

    const cueScreens = occupiedScreens(cue.screen, cue.spanScreens)

    return (
      (Number(cue.index) === firstTargetIndex &&
        Number(cue.layer ?? 0) === firstTargetLayer &&
        cueScreens.includes(firstTargetScreen)) ||
      (Number(cue.index) === secondTargetIndex &&
        Number(cue.layer ?? 0) === secondTargetLayer &&
        cueScreens.includes(secondTargetScreen))
    )
  })
}

const deleteObject = async (
  id: unknown,
  cueId: unknown,
  driveToken: string | null | undefined
) => {
  const cue = await Presentation.findOne(
    { _id: id, "cues._id": cueId },
    { "cues.$": 1, media: 1 }
  )

  if (!cue) {
    return null
  }

  const updatedPresentation = await Presentation.findByIdAndUpdate(
    id,
    {
      $pull: {
        cues: {
          _id: cueId,
        },
      },
    },
    { new: true }
  )

  const fileName = cue.cues[0].file?.id

  // Colour-only cues carry no file, so there is nothing to remove from storage.
  if (!fileName) {
    return updatedPresentation
  }

  // The media library owns the bytes of any cue created from it: cue and
  // library entry address the same key, and only an explicit library delete may
  // remove it. Legacy cues never appear in `media`, so this never fires for
  // them and their delete path is byte-for-byte the previous one.
  const isLibraryOwned = (cue.media || []).some((item) => item.id === fileName)
  if (isLibraryOwned) {
    return updatedPresentation
  }

  if (driveToken) {
    const driveFileId = cue.cues[0].file?.driveId
    if (driveFileId) {
      const presentation = await Presentation.findById(id)

      const sameFileCount = presentation!.cues.filter(
        (c) => c.file?.driveId === driveFileId
      ).length

      if (sameFileCount === 0) {
        await deleteDriveFile(driveFileId, driveToken)
      }
    }
  } else {
    const key = `${id}/${fileName}`
    await deleteFileS3(key)
  }

  return updatedPresentation
}

router.get(
  "/shared/:token",
  userExtractor,
  requireSharedPresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req

      const shared = { includeDriveBacked: true }

      presentation!.cues = await processS3Files(
        presentation!.cues,
        presentation!._id,
        shared
      )
      await processS3MediaFiles(presentation!.media, presentation!._id, shared)
      presentation!.scores = await processS3ScoreFiles(
        presentation!.scores || [],
        presentation!._id,
        shared
      )

      for (const score of presentation!.scores) {
        if (score.file?.id || score.file?.driveId) {
          score.file.proxyUrl = `/api/presentation/shared/${req.params.token}/scores/${score._id}/file`
        }
      }

      res.json(presentation)
    } catch (error) {
      next(error)
    }
  }
)

router.get(
  "/shared/:token/scores/:scoreId/file",
  userExtractor,
  requireSharedPresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const score = findScore(presentation!, req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      return await streamS3ScoreFile(res, presentation!, score)
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  "/:id/share",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation, user } = req

      const hasDriveFiles =
        presentation!.cues.some((cue) => cue.file?.driveId) ||
        (presentation!.media || []).some((item) => item.driveId) ||
        (presentation!.scores || []).some((score) => score.file?.driveId)

      if (hasDriveFiles) {
        if (!user!.driveToken) {
          return res.status(400).json({
            error:
              "Reconnect Google Drive to share this presentation: its media have to be copied first.",
          })
        }

        await snapshotDriveFilesToS3(presentation!, user!.driveToken)
      }

      if (!presentation!.shareToken) {
        presentation!.shareToken = crypto.randomBytes(24).toString("base64url")
        await presentation!.save({ validateModifiedOnly: true })
      }

      return res.json({ shareToken: presentation!.shareToken })
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  "/:id/share",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req

      presentation!.shareToken = undefined
      await presentation!.save({ validateModifiedOnly: true })

      return res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Returns all files related to a presentation.
 * Adds an expiring signed url to AWS Bucket for each file.
 */
router.get(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { user, presentation } = req

      // Update lastUsed for MRU sorting
      presentation!.lastUsed = new Date()
      await presentation!.save()

      if (user!.driveToken) {
        const driveToken = user!.driveToken
        presentation!.cues = await processDriveCueFiles(
          presentation!.cues,
          driveToken
        )
        await processDriveMediaFiles(presentation!.media, driveToken)
      }
      presentation!.cues = await processS3Files(
        presentation!.cues,
        presentation!._id
      )
      // Signed in place, so the media pool repopulates from the response the
      // editor already fetches on mount -- no extra client request.
      await processS3MediaFiles(presentation!.media, presentation!._id)
      await processPresentationScoreFiles(presentation!, user!)

      res.json(presentation)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Deletes a presentation and all associated cues and files.
 */
router.delete(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { user, presentation } = req

      for (const cue of presentation!.cues) {
        await deleteObject(presentation!._id, cue._id, user!.driveToken)
      }

      // Cues created from the library were skipped by deleteObject above,
      // because the library owns their bytes. Remove those objects here, or
      // dropping the presentation would orphan every pooled file.
      for (const item of presentation!.media || []) {
        if (user!.driveToken) {
          if (item.driveId) {
            await deleteDriveFile(item.driveId, user!.driveToken)
          }
        } else {
          await deleteFileS3(`${presentation!._id}/${item.id}`)
        }
      }

      for (const score of presentation!.scores || []) {
        await deleteScoreFile(presentation!._id, score, user!)
      }

      await Presentation.findByIdAndDelete(presentation!._id)
      return res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Media library ("media pool") for a presentation.
 *
 * Uploads land here first and stay here: an entry is independent of any cue, so
 * the pool survives a reload. Dragging an entry onto the timeline creates a cue
 * that reuses the entry's `id` (see PUT /:id below) -- the same storage object,
 * no copy, no second upload.
 */
router.post(
  "/:id/media",
  userExtractor,
  requirePresentationAccess,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { file, user, presentation } = req

      if (!file) {
        return res.status(400).json({ error: "No file provided" })
      }

      if (file.size > 50 * 1024 * 1024 && !user!.isAdmin) {
        return res.status(400).json({ error: "File size exceeds 50 MB limit" })
      }

      if (!isAllowedMimeType(file.mimetype)) {
        return res
          .status(400)
          .json({ error: `Invalid filetype: ${file.originalname}` })
      }

      const mediaId = generateFileId()
      const key = `${id}/${mediaId}`

      const entry: {
        id: string
        name: string
        url: string
        size: string
        type: string
        driveId?: string
      } = {
        id: mediaId,
        name: file.originalname || `file-${mediaId}`,
        url: "",
        size: String(file.size),
        type: file.mimetype,
      }

      if (storesOnDrive(presentation!, user!)) {
        const driveResponse = await uploadDriveFile(
          file.buffer,
          key,
          file.mimetype,
          user!.driveToken as string
        )
        entry.driveId = driveResponse.id as string
      } else {
        await uploadFileS3(file.buffer, key, file.mimetype)
      }

      presentation!.media.push(entry)
      await presentation!.save({ validateModifiedOnly: true })

      const saved = presentation!.media[presentation!.media.length - 1]

      if (saved.driveId) {
        await processDriveMediaFiles([saved], user!.driveToken as string)
      } else {
        await processS3MediaFiles([saved], id)
      }

      return res.status(201).json(saved)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Removes an entry from the media library -- permanently.
 *
 * The library owns the stored object, and a cue created from an entry shares
 * that object rather than holding a copy. There is therefore no way to keep a
 * cue working once its entry is gone, so the cues built from this entry are
 * removed with it and the object is deleted. The client warns before calling
 * this; the response reports which cues went, so it can drop them from view.
 *
 * Deleting a cue does the opposite and leaves the library untouched -- see
 * deleteObject above.
 */
router.delete(
  "/:id/media/:mediaId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { id, mediaId } = req.params
      const { user, presentation } = req

      const entry = (presentation!.media || []).find(
        (item) => item.id === mediaId
      )

      if (!entry) {
        return res.status(404).json({ error: "Media not found" })
      }

      const deletedCueIds = presentation!.cues
        .filter((cue) => cue.file?.id === mediaId)
        .map((cue) => cue._id.toString())

      const driveId = entry.driveId

      for (const cueId of deletedCueIds) {
        // @ts-expect-error -- .pull() exists at runtime, not on the Cue[] type
        presentation!.cues.pull({ _id: cueId })
      }
      // @ts-expect-error -- same as above
      presentation!.media.pull({ _id: entry._id })
      await presentation!.save({ validateModifiedOnly: true })

      if (user!.driveToken) {
        if (driveId) {
          await deleteDriveFile(driveId, user!.driveToken)
        }
      } else {
        await deleteFileS3(`${id}/${mediaId}`)
      }

      return res.json({ mediaId, deletedCueIds })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Updates presentation by ID, setting the new index count and adding them to mongoDB
 */
router.put(
  "/:id/indexCount",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { indexCount } = req.body

      const newIndexCount = Math.round(Number(indexCount))

      if (isNaN(newIndexCount)) {
        return res.status(400).json({ error: "indexCount must be a number" })
      }

      if (newIndexCount < 1 || newIndexCount > 101) {
        return res
          .status(400)
          .json({ error: "indexCount must be between 1 and 101" })
      }

      const updateQuery: {
        $set: { indexCount: number; frameLabels?: Record<string, string> }
        $pull?: Record<string, unknown>
      } = {
        $set: { indexCount: newIndexCount },
      }

      // If reducing index count, remove cues from indexes that will be removed
      let removedCuesCount = 0
      let removedScoreMarkersCount = 0
      if (newIndexCount < presentation!.indexCount) {
        const cuesToRemove = presentation!.cues.filter(
          (cue) => Number(cue.index) >= newIndexCount
        )
        removedCuesCount = cuesToRemove.length
        removedScoreMarkersCount = (presentation!.scores || []).reduce(
          (count, score) =>
            count +
            (score.markers || []).filter(
              (marker) => Number(marker.frameIndex) >= newIndexCount
            ).length,
          0
        )

        updateQuery.$pull = {
          cues: {
            _id: { $in: cuesToRemove.map((cue) => cue._id) },
          },
          "scores.$[].markers": {
            frameIndex: { $gte: newIndexCount },
          },
        }

        if (presentation!.frameLabels) {
          const kept = new Map<string, string>()
          for (const [frameKey, label] of presentation!.frameLabels.entries()) {
            if (Number(frameKey) < newIndexCount) {
              kept.set(frameKey, label)
            }
          }
          updateQuery.$set.frameLabels =
            kept.size > 0 ? Object.fromEntries(kept) : undefined
        }
      }

      const updatedPresentation = await Presentation.findByIdAndUpdate(
        presentation!._id,
        updateQuery,
        { new: true }
      )

      res.json({
        indexCount: updatedPresentation!.indexCount,
        removedCuesCount: removedCuesCount,
        removedScoreMarkersCount: removedScoreMarkersCount,
      })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Update presentation screenCount by ID. The screen position of audio cues is updated
 * by the presentation model's pre("validate") hook to always be screenCount + 1.
 */
router.put(
  "/:id/screenCount",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { screenCount } = req.body

      const newScreenCount = Math.round(Number(screenCount))

      if (isNaN(newScreenCount)) {
        return res.status(400).json({ error: "screenCount must be a number" })
      }

      if (newScreenCount < 1 || newScreenCount > 8) {
        return res
          .status(400)
          .json({ error: "screenCount must be between 1 and 8" })
      }

      // If reducing screen count, remove cues from screens that will be removed
      let removedCuesCount = 0
      if (newScreenCount < presentation!.screenCount) {
        const cuesToRemove = presentation!.cues.filter(
          (cue) =>
            cue.screen > newScreenCount &&
            cue.screen <= presentation!.screenCount
        )
        removedCuesCount = cuesToRemove.length

        // Remove cues from screens being deleted (excludes the audio row,
        // which always sits at screenCount + 1 and must survive)
        // filter() returns a plain array, not the DocumentArray cues is
        // hydrated as -- mongoose accepts a plain array back fine at runtime
        presentation!.cues = presentation!.cues.filter(
          (cue) =>
            !(
              cue.screen > newScreenCount &&
              cue.screen <= presentation!.screenCount
            )
        ) as unknown as PresentationDocument["cues"]

        // A surviving cue's own screen is guaranteed valid (it just passed
        // the filter above), but its spanScreens may still reference a
        // screen number that no longer exists -- drop those, and drop the
        // whole field if fewer than 2 valid screens remain (a "span" of one
        // screen is meaningless).
        presentation!.cues.forEach((cue) => {
          if (!Array.isArray(cue.spanScreens)) return
          const validSpanScreens = cue.spanScreens.filter(
            (screenNumber) => screenNumber <= newScreenCount
          )
          cue.spanScreens =
            validSpanScreens.length > 1 ? validSpanScreens : undefined
        })
      }

      // Must be presentation.save(), not a query-style update, since it
      // triggers the pre("validate") hook the audio-row repositioning depends on.
      presentation!.screenCount = newScreenCount

      if (presentation!.screenAspectRatios) {
        for (const screenKey of [...presentation!.screenAspectRatios.keys()]) {
          if (Number(screenKey) > newScreenCount) {
            presentation!.screenAspectRatios.delete(screenKey)
          }
        }
        if (presentation!.screenAspectRatios.size === 0) {
          presentation!.screenAspectRatios = undefined
        }
      }

      await presentation!.save()

      res.json({
        screenCount: presentation!.screenCount,
        removedCuesCount: removedCuesCount,
      })
    } catch (err) {
      next(err)
    }
  }
)

router.put(
  "/:id/outputAspectRatio",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { outputAspectRatio, screen } = req.body

      if (!isValidAspectRatio(outputAspectRatio)) {
        return res
          .status(400)
          .json({ error: "outputAspectRatio must look like W:H" })
      }

      if (screen === undefined || screen === null || screen === "") {
        presentation!.outputAspectRatio = outputAspectRatio
        presentation!.screenAspectRatios = undefined
      } else {
        const screenNumber = Number(screen)
        if (
          !Number.isInteger(screenNumber) ||
          screenNumber < 1 ||
          screenNumber > presentation!.screenCount
        ) {
          return res.status(400).json({
            error: `screen must be an integer between 1 and ${presentation!.screenCount}`,
          })
        }

        if (!presentation!.screenAspectRatios) {
          presentation!.screenAspectRatios = new Map<string, string>()
        }
        presentation!.screenAspectRatios.set(
          String(screenNumber),
          outputAspectRatio
        )
      }

      await presentation!.save()

      res.json({
        outputAspectRatio: presentation!.outputAspectRatio,
        screenAspectRatios: presentation!.screenAspectRatios
          ? Object.fromEntries(presentation!.screenAspectRatios)
          : {},
      })
    } catch (err) {
      next(err)
    }
  }
)

router.put(
  "/:id/frameLabel",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { index, label } = req.body
      const frameIndex = Number(index)

      if (
        !Number.isInteger(frameIndex) ||
        frameIndex < 0 ||
        frameIndex >= presentation!.indexCount
      ) {
        return res.status(400).json({
          error: `index must be an integer between 0 and ${presentation!.indexCount - 1}`,
        })
      }

      if (label !== undefined && label !== null && typeof label !== "string") {
        return res.status(400).json({ error: "label must be a string" })
      }

      const trimmed = typeof label === "string" ? label.trim() : ""
      if (trimmed.length > 60) {
        return res
          .status(400)
          .json({ error: "label must be 60 characters or fewer" })
      }

      if (!presentation!.frameLabels) {
        presentation!.frameLabels = new Map<string, string>()
      }

      if (trimmed.length === 0) {
        presentation!.frameLabels.delete(String(frameIndex))
      } else {
        presentation!.frameLabels.set(String(frameIndex), trimmed)
      }

      if (presentation!.frameLabels.size === 0) {
        presentation!.frameLabels = undefined
      }

      await presentation!.save()

      res.json({
        frameLabels: presentation!.frameLabels
          ? Object.fromEntries(presentation!.frameLabels)
          : {},
      })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Updates presentation name by ID.
 */
router.put(
  "/:id/name",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { name } = req.body

      if (typeof name !== "string") {
        return res
          .status(400)
          .json({ error: "Presentation name must be a string" })
      }

      const trimmedName = name.trim()
      if (trimmedName.length === 0 || trimmedName.length > 100) {
        return res.status(400).json({
          error: "Presentation name must be between 1 and 100 characters long",
        })
      }

      presentation!.name = trimmedName
      const updated = await presentation!.save({ validateModifiedOnly: true })

      res.json({ name: updated.name })
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  "/:id/scores",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { user, presentation } = req
      await processPresentationScoreFiles(presentation!, user!)
      res.json(presentation!.scores || [])
    } catch (error) {
      next(error)
    }
  }
)

router.get(
  "/:id/scores/:scoreId/file",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation, user } = req
      const score = findScore(presentation!, req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      if (!score.file) {
        return res.status(404).json({ error: "Score file not found" })
      }

      if (user!.driveToken && score.file.driveId) {
        const fileStream = await getDriveFileStream(
          score.file.driveId,
          user!.driveToken
        )
        if (!fileStream || typeof fileStream.pipe !== "function") {
          return res.status(404).json({ error: "Score file not found" })
        }
        setScoreFileHeaders(res, score)
        return fileStream.pipe(res)
      }

      return await streamS3ScoreFile(res, presentation!, score)
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  "/:id/scores/upload",
  userExtractor,
  requirePresentationAccess,
  upload.single("score"),
  async (req, res, next) => {
    try {
      const { file, presentation, user } = req
      const fileId = generateFileId()
      const pageCount = parseOptionalPositiveInteger(req.body.pageCount)

      if (!file) {
        return res.status(400).json({ error: "Score PDF file is required" })
      }

      if (!isPdfFile(file)) {
        return res.status(400).json({ error: "Only PDF scores are allowed" })
      }

      if (file.size > MAX_SCORE_FILE_SIZE && !user!.isAdmin) {
        return res.status(400).json({ error: "File size exceeds 50 MB limit" })
      }

      if (pageCount === null) {
        return res.status(400).json({
          error: "pageCount must be a positive integer",
        })
      }

      const title =
        validateScoreTitle(req.body.title) ||
        validateScoreTitle(file.originalname)

      if (!title) {
        return res
          .status(400)
          .json({ error: "Score title must be between 1 and 150 characters" })
      }

      const sourceUrl = trimText(req.body.sourceUrl)
      const imslpId = trimText(req.body.imslpId)
      const source = sourceUrl || imslpId ? "imslp" : "upload"

      const score: Score = {
        title,
        source,
        ...(sourceUrl && { sourceUrl }),
        ...(imslpId && { imslpId }),
        ...(pageCount && { pageCount }),
        markers: [],
        file: {
          id: fileId,
          name: file.originalname,
          url: "",
          size: String(file.size),
          type: file.mimetype || "application/pdf",
        },
      }

      presentation!.scores.push(score)
      const createdScore = presentation!.scores[presentation!.scores.length - 1]

      try {
        const driveResponse = await uploadScoreFile(
          presentation!._id,
          fileId,
          file,
          user!
        )

        if (driveResponse?.id) {
          createdScore.file!.driveId = driveResponse.id
        }
      } catch (error) {
        logger.error("Score upload error:", error)
        return res.status(500).json({ error: "Score upload failed" })
      }

      await presentation!.save({ validateModifiedOnly: true })

      const [processedScore] = user!.driveToken
        ? await processDriveScoreFiles([createdScore], user!.driveToken)
        : await processS3ScoreFiles([createdScore], presentation!._id)

      res.status(201).json(processedScore)
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  "/:id/scores/import",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const parsedUrl = parseUrl(req.body.sourceUrl)
      const pageCount = parseOptionalPositiveInteger(req.body.pageCount)

      if (!parsedUrl || !isImslpUrl(parsedUrl)) {
        return res.status(400).json({
          error: "A valid IMSLP URL is required",
        })
      }

      if (pageCount === null) {
        return res.status(400).json({
          error: "pageCount must be a positive integer",
        })
      }

      const title =
        validateScoreTitle(req.body.title) ||
        validateScoreTitle(
          decodeURIComponent(parsedUrl.pathname.split("/").pop() || "")
        )

      if (!title) {
        return res
          .status(400)
          .json({ error: "Score title must be between 1 and 150 characters" })
      }

      presentation!.scores.push({
        title,
        source: "imslp",
        sourceUrl: parsedUrl.toString(),
        imslpId: trimText(req.body.imslpId),
        markers: [],
        ...(pageCount && { pageCount }),
        file: {
          name: title,
          url: parsedUrl.toString(),
          size: "0",
          type: "application/pdf",
        },
      })

      await presentation!.save({ validateModifiedOnly: true })

      res
        .status(201)
        .json(presentation!.scores[presentation!.scores.length - 1])
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  "/:id/scores/:scoreId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation, user } = req
      const { scoreId } = req.params
      const score = findScore(presentation!, scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      await deleteScoreFile(presentation!._id, score, user!)
      score.deleteOne()
      await presentation!.save({ validateModifiedOnly: true })

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

const buildMarkerFromBody = (
  body: Record<string, unknown>,
  presentation: PresentationDocument,
  score: Score
) => {
  const page = parseMarkerInteger(body.page)
  const frameIndex = parseMarkerInteger(body.frameIndex)

  if (page === null || page < 1) {
    return { error: "marker page must be a positive integer" }
  }

  if (
    frameIndex === null ||
    frameIndex < 0 ||
    frameIndex >= presentation.indexCount
  ) {
    return {
      error: `marker frameIndex must be between 0 and ${presentation.indexCount - 1}`,
    }
  }

  if (score.pageCount && page > score.pageCount) {
    return { error: `marker page must be between 1 and ${score.pageCount}` }
  }

  let rect
  try {
    rect = parseMarkerRect(body.rect)
  } catch {
    return { error: "marker rect must be valid JSON" }
  }

  if (rect === null) {
    return { error: "marker rect values must be between 0 and 1" }
  }

  const measureLabel = trimText(body.measureLabel)
  const note = trimText(body.note)

  if (measureLabel.length > 80) {
    return { error: "marker measureLabel must be at most 80 characters" }
  }

  if (note.length > 300) {
    return { error: "marker note must be at most 300 characters" }
  }

  return {
    marker: {
      page,
      frameIndex,
      measureLabel,
      note,
      ...(rect && { rect }),
    },
  }
}

router.post(
  "/:id/scores/:scoreId/markers",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const score = findScore(presentation!, req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      const result = buildMarkerFromBody(req.body, presentation!, score)
      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      score.markers.push(result.marker!)
      await presentation!.save({ validateModifiedOnly: true })

      res.status(201).json(score.markers[score.markers.length - 1])
    } catch (error) {
      next(error)
    }
  }
)

router.put(
  "/:id/scores/:scoreId/markers/:markerId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const score = findScore(presentation!, req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      const marker = score.markers.id(req.params.markerId)
      if (!marker) {
        return res.status(404).json({ error: "Score marker not found" })
      }

      const result = buildMarkerFromBody(req.body, presentation!, score)
      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      marker.set(result.marker!)
      await presentation!.save({ validateModifiedOnly: true })

      res.json(marker)
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  "/:id/scores/:scoreId/markers/:markerId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const score = findScore(presentation!, req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      const marker = score.markers.id(req.params.markerId)
      if (!marker) {
        return res.status(404).json({ error: "Score marker not found" })
      }

      marker.deleteOne()
      await presentation!.save({ validateModifiedOnly: true })

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Creates a new cue for a presentation, uploading files to mongoDB and AWS bucket or Google Drive.
 * Can upload any kind of image, pdf, or audio file depending on the target screen.
 * Validates cue type matches the target screen type and checks for position conflicts.
 * @var {Middleware} upload.single - Exports the file from requests and adds it to multer cache
 */
router.put(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const fileId = generateFileId()
      const { file, user, presentation } = req
      const { cueName, driveId, mediaId } = req.body
      const index = Number(req.body.index)
      const screen = Number(req.body.screen)
      const loop = req.body.loop
      const continuePlayback = req.body.continuePlayback
      const color = req.body.color || "#000000"
      const layer = Number(req.body.layer) || 0
      const opacity = parseCueOpacity(req.body.opacity, 1)
      const { spanScreens, error: spanScreensError } = parseSpanScreens(
        req.body.spanScreens
      )
      const {
        spanFill: newSpanFill,
        spanPosition: newSpanPosition,
        error: newSpanFramingError,
      } = parseSpanFraming(req.body)
      const { duration, error: durationError } = parseDuration(
        req.body.duration
      )
      const cueText = parseCueText(req.body)
      const imageEffect = parseImageEffect(req.body)
      const { frame, error: frameError } = parseFrame(req.body.frame)

      if (durationError || frameError) {
        return res.status(400).json({ error: durationError || frameError })
      }

      if (cueText.error) {
        return res.status(400).json({ error: cueText.error })
      }

      if (imageEffect.error) {
        return res.status(400).json({ error: imageEffect.error })
      }

      if (!id || isNaN(index) || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (newSpanFramingError) {
        return res.status(400).json({ error: newSpanFramingError })
      }

      if (spanScreensError) {
        return res.status(400).json({ error: spanScreensError })
      }

      if (opacity === null) {
        return res.status(400).json({
          error: "Invalid opacity. Opacity must be a number between 0 and 1.",
        })
      }

      if (
        cueName !== undefined &&
        cueName !== null &&
        typeof cueName !== "string"
      ) {
        return res.status(400).json({ error: "Cue name must be a string" })
      }

      const trimmedCueName = typeof cueName === "string" ? cueName.trim() : ""
      if (trimmedCueName.length > 100) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      const audioRow = getAudioRow(presentation!.screenCount)

      if (screen < 1 || screen > audioRow) {
        return res.status(400).json({
          error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${audioRow}.`,
        })
      }

      // A cue gets its media either from a multipart upload (the original
      // path) or by naming an existing library entry. In the second case no
      // bytes move: the cue copies the entry's id, hence its storage key.
      const libraryEntry = mediaId
        ? (presentation!.media || []).find((item) => item.id === mediaId)
        : null

      if (mediaId && !libraryEntry) {
        return res
          .status(404)
          .json({ error: "Media not found in this presentation" })
      }

      const hasMedia = Boolean(file || libraryEntry)
      const mediaMimeType = file ? file.mimetype : libraryEntry?.type

      if (index < 0 || index > 100) {
        return res.status(400).json({
          error: `Invalid cue index: ${index}. Index must be between 0 and 100.`,
        })
      }

      if (file && file.size > 50 * 1024 * 1024 && !user!.isAdmin) {
        return res.status(400).json({ error: "File size exceeds 50 MB limit" })
      }

      if (file && !isAllowedMimeType(file.mimetype)) {
        return res
          .status(400)
          .json({ error: `Invalid filetype: ${file.originalname}` })
      }

      const cueType = getCueTypeFromScreen(screen, presentation!.screenCount)

      if (cueText.text && (cueType !== "visual" || hasMedia)) {
        return res.status(400).json({
          error:
            "Text is only allowed on a visual element without a media file.",
        })
      }

      if (cueType === "audio") {
        if (hasMedia && !isAudioMimeType(mediaMimeType)) {
          return res.status(400).json({
            error: "Only audio files are allowed on the audio screen.",
          })
        }
      } else {
        if (hasMedia && isAudioMimeType(mediaMimeType)) {
          return res.status(400).json({
            error:
              "Audio files are not allowed on visual screens. Please use the audio screen.",
          })
        }
      }

      const isColorOnlyCue = cueType === "visual" && !hasMedia
      if (!isColorOnlyCue && trimmedCueName.length === 0) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      if (
        spanScreens &&
        !isValidSpanScreens(
          spanScreens,
          screen,
          cueType,
          presentation!.screenCount
        )
      ) {
        return res.status(400).json({
          error:
            "spanScreens must include the cue's own screen, have no duplicates, only reference visual cues and valid screen numbers.",
        })
      }

      const maxLayers = getMaxLayers(cueType)
      if (layer < 0 || layer >= maxLayers) {
        return res.status(400).json({
          error: `Invalid layer: ${layer}. Layer must be between 0 and ${maxLayers - 1}.`,
        })
      }

      if (
        hasPositionConflict(
          presentation!.cues,
          index,
          screen,
          layer,
          null,
          spanScreens
        )
      ) {
        return res.status(400).json({
          error: "A cue with the same index, screen and layer already exists.",
        })
      }

      // Same id as the library entry => same storage key => one shared object.
      const fileObject: CueFile = libraryEntry
        ? {
            id: libraryEntry.id,
            name: libraryEntry.name,
            url: "",
            size: libraryEntry.size,
            type: libraryEntry.type,
            ...(libraryEntry.driveId && { driveId: libraryEntry.driveId }),
          }
        : {
            id: fileId,
            name: file?.originalname || `file-${fileId}`,
            url: "",
            // Or the schema default applies, and an mp4 is stored as image/jpeg.
            ...(file?.mimetype && { type: file.mimetype }),
            ...(file?.size !== undefined && { size: String(file.size) }),
            ...(driveId && { driveId }),
          }

      const updatedPresentation = (await Presentation.findByIdAndUpdate(
        presentation!._id,
        {
          $push: {
            cues: {
              cueType,
              index: index,
              name: trimmedCueName,
              screen: screen,
              ...(spanScreens ? { spanScreens } : {}),
              // Framing rides along only with an actual span.
              ...(spanScreens && newSpanFill ? { spanFill: newSpanFill } : {}),
              ...(spanScreens && newSpanPosition
                ? { spanPosition: newSpanPosition }
                : {}),
              ...(duration && cueType === "visual" ? { duration } : {}),
              ...(cueText.text
                ? {
                    text: cueText.text,
                    ...(cueText.textColor && { textColor: cueText.textColor }),
                    ...(cueText.textSize && { textSize: cueText.textSize }),
                    ...(cueText.textEffect && {
                      textEffect: cueText.textEffect,
                    }),
                    ...(cueText.textEffectSpeed && {
                      textEffectSpeed: cueText.textEffectSpeed,
                    }),
                    ...(cueText.textEffectLoop !== undefined && {
                      textEffectLoop: cueText.textEffectLoop,
                    }),
                  }
                : {}),
              ...(hasMedia && isImageMimeType(mediaMimeType)
                ? {
                    ...(imageEffect.imageEffect && {
                      imageEffect: imageEffect.imageEffect,
                    }),
                    ...(imageEffect.imageEffectSpeed && {
                      imageEffectSpeed: imageEffect.imageEffectSpeed,
                    }),
                    ...(imageEffect.imageEffectLoop !== undefined && {
                      imageEffectLoop: imageEffect.imageEffectLoop,
                    }),
                  }
                : {}),
              ...(frame && cueType === "visual" ? { frame } : {}),
              file: hasMedia ? fileObject : null,
              color: color,
              loop: loop,
              continuePlayback: cueType === "audio" ? continuePlayback : false,
              layer: layer,
              opacity: opacity,
            },
          },
        },
        { new: true }
      ))!

      if (storesOnDrive(presentation!, user!)) {
        if (file) {
          if (driveId) {
            updatedPresentation.cues = updatedPresentation.cues.map((cue) => {
              if (cue.file?.id === fileId) {
                cue.file.driveId = driveId
              }
              return cue
            })
          } else {
            const fileName = `${id}/${fileId}`
            const driveToken = user!.driveToken as string
            const driveResponse = await uploadDriveFile(
              file.buffer,
              fileName,
              file.mimetype,
              driveToken
            )

            updatedPresentation.cues = updatedPresentation.cues.map((cue) => {
              if (cue.file?.id === fileId) {
                cue.file.driveId = driveResponse.id as string
              }
              return cue
            })
          }
        }

        const driveToken = user!.driveToken as string
        updatedPresentation.cues = await processDriveCueFiles(
          updatedPresentation.cues,
          driveToken
        )

        await updatedPresentation.save()
        res.json(updatedPresentation)
      } else {
        if (file) {
          const fileName = `${id}/${fileId}`

          await uploadFileS3(file.buffer, fileName, file.mimetype)
        }
        // A library-created cue uploads nothing but still needs a signed URL.
        if (hasMedia) {
          updatedPresentation.cues = await processS3Files(
            updatedPresentation.cues,
            id
          )
        }
        res.json(updatedPresentation)
      }
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Shift cue indices in bulk starting after startIndex.
 * body: { startIndex: number, direction: 'left'|'right' }
 */
router.put(
  "/:id/shiftIndexes",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { startIndex, direction, endIndex, screen, layer } = req.body

      if (
        typeof startIndex !== "number" ||
        !["left", "right"].includes(direction)
      ) {
        return res.status(400).json({ error: "Invalid parameters" })
      }

      if (endIndex !== undefined && typeof endIndex !== "number") {
        return res.status(400).json({ error: "endIndex must be a number" })
      }

      if (screen !== undefined && typeof screen !== "number") {
        return res.status(400).json({ error: "screen must be a number" })
      }

      if (layer !== undefined && typeof layer !== "number") {
        return res.status(400).json({ error: "layer must be a number" })
      }

      const inScope = (cue: Cue) =>
        (endIndex === undefined || Number(cue.index) <= endIndex) &&
        (screen === undefined || Number(cue.screen) === screen) &&
        (layer === undefined || Number(cue.layer ?? 0) === layer)

      let modified = false
      for (const cue of presentation!.cues) {
        if (cue.index > startIndex && inScope(cue)) {
          if (direction === "left") {
            cue.index = Number(cue.index) - 1
            modified = true
          } else if (direction === "right") {
            cue.index = Number(cue.index) + 1
            modified = true
          }
        }
      }

      const isStructuralShift =
        endIndex === undefined && screen === undefined && layer === undefined

      for (const score of isStructuralShift ? presentation!.scores || [] : []) {
        for (const marker of score.markers || []) {
          if (Number(marker.frameIndex) > startIndex) {
            if (direction === "left") {
              marker.frameIndex = Number(marker.frameIndex) - 1
              modified = true
            } else if (direction === "right") {
              marker.frameIndex = Number(marker.frameIndex) + 1
              modified = true
            }
          }
        }
      }

      if (isStructuralShift && presentation!.frameLabels) {
        const remapped = new Map<string, string>()
        for (const [frameKey, label] of presentation!.frameLabels.entries()) {
          const frameIndex = Number(frameKey)
          if (frameIndex <= startIndex) {
            remapped.set(frameKey, label)
            continue
          }
          const nextIndex =
            direction === "left" ? frameIndex - 1 : frameIndex + 1
          if (nextIndex >= 0) {
            remapped.set(String(nextIndex), label)
          }
          modified = true
        }
        presentation!.frameLabels = remapped.size > 0 ? remapped : undefined
      }

      if (modified) {
        await presentation!.save({ validateModifiedOnly: true })
      }

      res.json({ shifted: modified })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Swaps two cues to different positions, validating that cue types match target screens.
 * Rejects swaps that would collide with a third cue at either target position.
 */
router.put(
  "/:id/swapCues",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { presentation, user } = req
      const {
        firstCueId,
        secondCueId,
        firstIndex,
        firstScreen,
        firstLayer,
        secondIndex,
        secondScreen,
        secondLayer,
      } = req.body

      const parsedFirstIndex = Number(firstIndex)
      const parsedFirstScreen = Number(firstScreen)
      const parsedFirstLayer = Number(firstLayer ?? 0)
      const parsedSecondIndex = Number(secondIndex)
      const parsedSecondScreen = Number(secondScreen)
      const parsedSecondLayer = Number(secondLayer ?? 0)
      const maxScreen = presentation!.screenCount + 1

      // Validate request payload.
      if (
        !firstCueId ||
        !secondCueId ||
        isNaN(parsedFirstIndex) ||
        isNaN(parsedFirstScreen) ||
        isNaN(parsedFirstLayer) ||
        isNaN(parsedSecondIndex) ||
        isNaN(parsedSecondScreen) ||
        isNaN(parsedSecondLayer)
      ) {
        return res.status(400).json({ error: "Missing required swap fields" })
      }

      if (
        !Number.isInteger(parsedFirstIndex) ||
        !Number.isInteger(parsedFirstScreen) ||
        !Number.isInteger(parsedFirstLayer) ||
        !Number.isInteger(parsedSecondIndex) ||
        !Number.isInteger(parsedSecondScreen) ||
        !Number.isInteger(parsedSecondLayer)
      ) {
        return res
          .status(400)
          .json({ error: "Swap coordinates and layers must be integers" })
      }

      if (firstCueId === secondCueId) {
        return res.status(400).json({ error: "Cannot swap a cue with itself" })
      }

      if (
        parsedFirstIndex < 0 ||
        parsedFirstIndex >= presentation!.indexCount ||
        parsedSecondIndex < 0 ||
        parsedSecondIndex >= presentation!.indexCount ||
        parsedFirstScreen < 1 ||
        parsedFirstScreen > maxScreen ||
        parsedSecondScreen < 1 ||
        parsedSecondScreen > maxScreen
      ) {
        return res.status(400).json({ error: "Invalid swap target position" })
      }

      // Resolve and validate the cues being swapped.
      // @ts-expect-error -- .id() exists at runtime, not on the Cue[] type
      const firstCue: Cue = presentation!.cues.id(firstCueId)
      // @ts-expect-error -- same as above
      const secondCue: Cue = presentation!.cues.id(secondCueId)

      if (!firstCue || !secondCue) {
        return res.status(404).json({ error: "Cue not found" })
      }

      const firstTargetCueType = getCueTypeFromScreen(
        parsedFirstScreen,
        presentation!.screenCount
      )
      const secondTargetCueType = getCueTypeFromScreen(
        parsedSecondScreen,
        presentation!.screenCount
      )
      const firstCurrentCueType =
        firstCue.cueType ??
        getCueTypeFromScreen(firstCue.screen, presentation!.screenCount)
      const secondCurrentCueType =
        secondCue.cueType ??
        getCueTypeFromScreen(secondCue.screen, presentation!.screenCount)
      const firstCueMatchesTargetRow =
        firstCurrentCueType === firstTargetCueType
      const secondCueMatchesTargetRow =
        secondCurrentCueType === secondTargetCueType

      if (!firstCueMatchesTargetRow || !secondCueMatchesTargetRow) {
        return res
          .status(400)
          .json({ error: "Cue type does not match swap target screen" })
      }

      const firstMaxLayers = getMaxLayers(firstTargetCueType)
      const secondMaxLayers = getMaxLayers(secondTargetCueType)
      if (
        parsedFirstLayer < 0 ||
        parsedFirstLayer >= firstMaxLayers ||
        parsedSecondLayer < 0 ||
        parsedSecondLayer >= secondMaxLayers
      ) {
        return res.status(400).json({ error: "Invalid swap target layer" })
      }

      // Reject swaps that would collide with a third cue.
      if (
        hasSwapTargetConflict(
          presentation!.cues,
          firstCueId,
          secondCueId,
          parsedFirstIndex,
          parsedFirstScreen,
          parsedFirstLayer,
          parsedSecondIndex,
          parsedSecondScreen,
          parsedSecondLayer
        )
      ) {
        return res.status(400).json({
          error: "Swap target position is already occupied by another cue.",
        })
      }

      // Apply the swap and persist the normalized cue types. A swapped cue
      // always lands on a new screen, so any previous span is stale -- clear
      // it rather than carry it along; the user can re-open Multi-screen
      // from its new position.
      firstCue.index = parsedFirstIndex
      firstCue.screen = parsedFirstScreen
      firstCue.cueType = firstTargetCueType
      firstCue.layer = parsedFirstLayer
      firstCue.spanScreens = undefined
      secondCue.index = parsedSecondIndex
      secondCue.screen = parsedSecondScreen
      secondCue.cueType = secondTargetCueType
      secondCue.layer = parsedSecondLayer
      secondCue.spanScreens = undefined

      await presentation!.save({ validateModifiedOnly: true })

      // Rehydrate file URLs for the response.
      if (user!.driveToken) {
        const [updatedFirstCue, updatedSecondCue] = await processDriveCueFiles(
          [firstCue, secondCue],
          user!.driveToken
        )
        return res.json({
          firstCue: updatedFirstCue,
          secondCue: updatedSecondCue,
        })
      }

      const [updatedFirstCue, updatedSecondCue] = await processS3Files(
        [firstCue, secondCue],
        id
      )
      return res.json({
        firstCue: updatedFirstCue,
        secondCue: updatedSecondCue,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Updates a specific cue by ID, allowing modification of position, name, color, loop status, and file.
 * Handles file upload/replacement and deletion, managing storage on AWS S3 or Google Drive.
 * Validates that the updated cue type matches the target screen type.
 */
router.put(
  "/:id/:cueId",
  userExtractor,
  requirePresentationAccess,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { id, cueId } = req.params
      const { file, user, presentation } = req
      const { cueName } = req.body
      const index = Number(req.body.index)
      const screen = Number(req.body.screen)
      const loop = req.body.loop
      const continuePlayback = req.body.continuePlayback
      const hasContinuePlayback = req.body.continuePlayback !== undefined
      // default fallback color is yellow, but it should never be used since color is a required field in the frontend
      const color = req.body.color || "#fded11"
      const opacity = parseCueOpacity(req.body.opacity, undefined)

      const image = req.body.image
      const shouldClearFile = image === "null"

      // Whether this request even mentions spanScreens at all -- distinct
      // from `spanScreens` being null/empty, which means "clear the span".
      // A save that doesn't touch spanScreens (e.g. the name/opacity ToolBox
      // modal) must not silently wipe out an existing span.
      const spanScreensProvided = req.body.spanScreens !== undefined
      const { spanScreens, error: spanScreensError } = parseSpanScreens(
        req.body.spanScreens
      )
      const durationProvided = req.body.duration !== undefined
      const { duration, error: durationError } = parseDuration(
        req.body.duration
      )
      const cueText = parseCueText(req.body)
      const imageEffect = parseImageEffect(req.body)
      const frameProvided = req.body.frame !== undefined
      const { frame, error: frameError } = parseFrame(req.body.frame)
      const {
        spanFill,
        spanPosition,
        error: spanFramingError,
      } = parseSpanFraming(req.body)

      if (durationError || frameError) {
        return res.status(400).json({ error: durationError || frameError })
      }

      if (spanFramingError) {
        return res.status(400).json({ error: spanFramingError })
      }

      if (cueText.error) {
        return res.status(400).json({ error: cueText.error })
      }

      if (imageEffect.error) {
        return res.status(400).json({ error: imageEffect.error })
      }

      if (!id || isNaN(index) || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (spanScreensError) {
        return res.status(400).json({ error: spanScreensError })
      }

      if (opacity === null) {
        return res.status(400).json({
          error: "Invalid opacity. Opacity must be a number between 0 and 1.",
        })
      }

      if (
        cueName !== undefined &&
        cueName !== null &&
        typeof cueName !== "string"
      ) {
        return res.status(400).json({ error: "Cue name must be a string" })
      }

      const trimmedCueName = typeof cueName === "string" ? cueName.trim() : ""
      if (trimmedCueName.length > 100) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      const audioRow = getAudioRow(presentation!.screenCount)

      if (screen < 1 || screen > audioRow) {
        return res.status(400).json({
          error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${audioRow}.`,
        })
      }

      if (index < 0 || index >= presentation!.indexCount) {
        return res.status(400).json({
          error: `Invalid cue index: ${index}. Index must be between 0 and ${presentation!.indexCount - 1}.`,
        })
      }

      const cueType = getCueTypeFromScreen(screen, presentation!.screenCount)

      if (cueType === "audio") {
        if (file && !isAudioMimeType(file.mimetype)) {
          return res.status(400).json({
            error: "Only audio files are allowed on the audio screen.",
          })
        }
      } else {
        if (file && isAudioMimeType(file.mimetype)) {
          return res.status(400).json({
            error:
              "Audio files are not allowed on visual screens. Please use the audio screen.",
          })
        }
      }

      // @ts-expect-error -- .id() exists at runtime, not on the Cue[] type
      const cue: Cue = presentation!.cues.id(cueId)
      if (!cue) {
        return res.status(404).json({ error: "Cue not found" })
      }

      const willHaveFileAfterUpdate =
        Boolean(file) || (!shouldClearFile && Boolean(cue.file))
      const willHaveImageAfterUpdate =
        cueType === "visual" &&
        isImageMimeType(
          file ? file.mimetype : shouldClearFile ? undefined : cue.file?.type
        )
      const isColorOnlyCue = cueType === "visual" && !willHaveFileAfterUpdate
      if (!isColorOnlyCue && trimmedCueName.length === 0) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      const nextText = cueText.provided
        ? cueText.text
        : file
          ? undefined
          : cue.text || undefined
      if (nextText && (cueType !== "visual" || willHaveFileAfterUpdate)) {
        return res.status(400).json({
          error:
            "Text is only allowed on a visual element without a media file.",
        })
      }

      if (
        spanScreens &&
        !isValidSpanScreens(
          spanScreens,
          screen,
          cueType,
          presentation!.screenCount
        )
      ) {
        return res.status(400).json({
          error:
            "spanScreens must include the cue's own screen, have no duplicates, only reference visual cues and valid screen numbers.",
        })
      }

      const layer =
        req.body.layer !== undefined
          ? Number(req.body.layer) || 0
          : (cue.layer ?? 0)
      const maxLayers = getMaxLayers(cueType)
      if (layer < 0 || layer >= maxLayers) {
        return res.status(400).json({
          error: `Invalid layer: ${layer}. Layer must be between 0 and ${maxLayers - 1}.`,
        })
      }

      if (
        hasPositionConflict(
          presentation!.cues,
          index,
          screen,
          layer,
          cueId,
          spanScreens
        )
      ) {
        return res.status(400).json({
          error: "A cue with the same index, screen and layer already exists.",
        })
      }

      // Update cue fields
      const isMovingToAnotherScreen = screen !== cue.screen
      cue.index = index
      cue.screen = screen
      cue.cueType = cueType
      if (spanScreensProvided) {
        // Honor an explicit spanScreens even when the screen also changed in
        // the same request -- it was already validated above against the
        // NEW screen, so it's guaranteed consistent.
        cue.spanScreens = spanScreens || undefined
      } else if (isMovingToAnotherScreen) {
        // A span is only meaningful relative to where the cue actually
        // lives; moving it without saying anything about spanScreens
        // invalidates any previous span rather than silently carrying it,
        // possibly stale, to the new screen.
        cue.spanScreens = undefined
      }
      if (spanFill !== undefined) {
        cue.spanFill = spanFill ?? undefined
      }
      if (spanPosition !== undefined) {
        cue.spanPosition = spanPosition ?? undefined
      }
      // Framing only means anything alongside a span; carrying it on a cue
      // that no longer spans would resurface it if the span came back.
      if (!cue.spanScreens) {
        cue.spanFill = undefined
        cue.spanPosition = undefined
      }
      if (frameProvided) {
        cue.frame = frame && cueType === "visual" ? frame : undefined
      }
      if (durationProvided) {
        cue.duration = duration && cueType === "visual" ? duration : undefined
      }
      cue.name = trimmedCueName
      cue.text = nextText
      cue.textColor = nextText
        ? (cueText.textColor ?? cue.textColor)
        : undefined
      cue.textSize = nextText ? (cueText.textSize ?? cue.textSize) : undefined
      cue.textEffect = nextText
        ? (cueText.textEffect ?? cue.textEffect)
        : undefined
      cue.textEffectSpeed = nextText
        ? (cueText.textEffectSpeed ?? cue.textEffectSpeed)
        : undefined
      cue.textEffectLoop = nextText
        ? (cueText.textEffectLoop ?? cue.textEffectLoop)
        : undefined
      cue.imageEffect = willHaveImageAfterUpdate
        ? (imageEffect.imageEffect ?? cue.imageEffect)
        : undefined
      cue.imageEffectSpeed = willHaveImageAfterUpdate
        ? (imageEffect.imageEffectSpeed ?? cue.imageEffectSpeed)
        : undefined
      cue.imageEffectLoop = willHaveImageAfterUpdate
        ? (imageEffect.imageEffectLoop ?? cue.imageEffectLoop)
        : undefined
      cue.loop = loop
      cue.continuePlayback =
        cueType === "audio"
          ? hasContinuePlayback
            ? continuePlayback
            : (cue.continuePlayback ?? false)
          : false
      cue.color = color
      cue.layer = layer
      cue.opacity = opacity === undefined ? (cue.opacity ?? 1) : opacity

      if (shouldClearFile) {
        cue.file = null
      }

      if (user!.driveToken) {
        if (file) {
          const newFileId = generateFileId()

          // The library owns the bytes of a cue created from it; only an
          // explicit library delete may remove them. Never true for a legacy
          // cue, whose id is not in `media`.
          const isLibraryOwned = (presentation!.media || []).some(
            (item) => item.id === cue.file?.id
          )

          if (cue.file && cue.file.url && !isLibraryOwned) {
            const driveToken = user!.driveToken
            if (cue.file.driveId) {
              const sameFileCount = presentation!.cues.filter(
                (c) => c.file?.driveId === cue.file!.driveId
              ).length

              if (sameFileCount === 0) {
                await deleteDriveFile(cue.file.driveId, driveToken)
              }
            }
          }
          try {
            const fileName = `${id}/${newFileId}`
            const driveToken = user!.driveToken
            const driveResponse = await uploadDriveFile(
              file.buffer,
              fileName,
              file.mimetype,
              driveToken
            )

            cue.file!.driveId = driveResponse.id as string
          } catch (error) {
            logger.error("File upload error:", error)
            return res.status(500).json({ error: "File upload failed" })
          }
        }
        await presentation!.save({ validateModifiedOnly: true })

        const driveToken = user!.driveToken
        const updatedCue = await processDriveCueFiles([cue], driveToken)
        res.json(updatedCue[0])
      } else {
        if (file) {
          const newFileId = generateFileId()

          // See the Drive branch above: a library-owned object outlives the
          // cue that referenced it.
          const isLibraryOwned = (presentation!.media || []).some(
            (item) => item.id === cue.file?.id
          )

          if (cue.file && cue.file.url && !isLibraryOwned) {
            const oldFileName = cue.file.url.split("/").pop()
            await deleteFileS3(`${id}/${oldFileName}`)
          }
          try {
            const fileName = `${id}/${newFileId}`
            await uploadFileS3(file.buffer, fileName, file.mimetype)
            cue.file = {
              id: newFileId,
              name: file.originalname,
              url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
              type: file.mimetype,
              size: String(file.size),
            }
            await generateSignedUrlForS3(cue, id)
          } catch (error) {
            logger.error("File upload error:", error)
            return res.status(500).json({ error: "File upload failed" })
          }
        }
        await presentation!.save({ validateModifiedOnly: true })

        const updatedCue = await processS3Files([cue], id)
        res.json(updatedCue[0])
      }
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Update the presentation by removing a file from the files array.
 */
router.delete(
  "/:id/:cueId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { cueId } = req.params
      const { user, presentation } = req
      const updatedPresentation = await deleteObject(
        presentation!._id,
        cueId,
        user!.driveToken
      )

      if (!updatedPresentation) {
        return res.status(404).json({ error: "Cue not found" })
      }

      res.json(updatedPresentation)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

export = router
