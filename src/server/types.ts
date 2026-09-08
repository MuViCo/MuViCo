/**
 * Domain types for src/server, matching the Mongoose schemas in models/.
 *
 * These are plain attributes, not Mongoose documents -- a cue read from the
 * raw collection or a JSON response isn't a Document, only what a route
 * handler gets via HydratedDocument<PresentationAttrs> is.
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

// userExtractor/requirePresentationAccess (utils/middleware.ts) attach these
// to the request once auth passes.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // null means "token pointed at a user id that doesn't exist anymore"
      user?: UserDocument | null
      presentation?: PresentationDocument
      token?: string
    }
  }
}
