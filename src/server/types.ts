/**
 * Domain model for src/server, derived from the Mongoose schemas
 * (models/presentation.ts, models/user.ts) rather than from prose comments.
 *
 * These are plain attribute shapes, not Mongoose document types: a route
 * handler's `presentation` is a HydratedDocument<PresentationAttrs>, but a
 * cue pulled out of it, JSON-serialized, or read from the raw collection in a
 * migration script is not a Document at all. Keeping the attributes here and
 * building `HydratedDocument<...>` at each call site (models/*.ts) is what
 * lets both cases use the same field types.
 */
import type { HydratedDocument, Types } from "mongoose"

export interface CueFile {
  id?: string
  name?: string
  url?: string
  driveId?: string
  thumbnailId?: string
  thumbnailDriveId?: string
  size?: string
  type?: string
}

export type CueType = "visual" | "audio"

export interface Cue {
  _id: Types.ObjectId
  cueType: CueType
  index: number
  name: string
  screen: number
  spanScreens?: number[]
  color?: string
  file?: CueFile | null
  loop?: boolean
  continuePlayback?: boolean
  opacity?: number
  layer?: number
}

export interface MediaEntry {
  _id?: Types.ObjectId
  id: string
  name: string
  url?: string
  driveId?: string
  size?: string
  type?: string
  createdAt?: Date
}

export interface ScoreFile {
  id?: string
  name?: string
  url?: string
  proxyUrl?: string
  driveId?: string
  size?: string
  type?: string
}

export interface ScoreMarkerRect {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface ScoreMarker {
  _id?: Types.ObjectId
  page: number
  frameIndex: number
  measureLabel?: string
  note?: string
  rect?: ScoreMarkerRect
}

export type ScoreSource = "upload" | "imslp"

export interface Score {
  _id?: Types.ObjectId
  title: string
  source: ScoreSource
  sourceUrl?: string
  imslpId?: string
  pageCount?: number
  file?: ScoreFile
  markers: ScoreMarker[]
  createdAt?: Date
}

export type StorageBackend = "aws" | "googleDrive"

export interface PresentationAttrs {
  name: string
  description?: string
  user?: Types.ObjectId
  storage: StorageBackend
  screenCount: number
  indexCount: number
  lastUsed?: Date
  cues: Cue[]
  media: MediaEntry[]
  scores: Score[]
}

export type PresentationDocument = HydratedDocument<PresentationAttrs>

export interface UserAttrs {
  username: string
  firebaseUid?: string
  passwordHash?: string
  presentations: Types.ObjectId[]
  isAdmin: boolean
  driveToken?: string | null
  refreshTokenHash?: string | null
  refreshTokenExpires?: Date | null
}

export type UserDocument = HydratedDocument<UserAttrs>

/*
 * Express augmentation: userExtractor/requirePresentationAccess
 * (utils/middleware.ts) attach these to every authenticated request.
 * `token` is set by getTokenFrom regardless of whether the token is valid.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // `null` (not just absent) is a real, distinct value here: it's what
      // userExtractor (utils/middleware.ts) sets when the token's user id no
      // longer resolves to a User document.
      user?: UserDocument | null
      presentation?: PresentationDocument
      token?: string
    }
  }
}
