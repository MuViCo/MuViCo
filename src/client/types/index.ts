import type { AlertStatus } from "@chakra-ui/react"

/**
 * Domain types for the MuViCo client.
 *
 * These are derived from the Mongoose schemas in src/server/models/ and from the
 * actual response bodies in src/server/routes/ — NOT from the prose comments,
 * which are out of date in several places. Where the client and server disagree,
 * the disagreement is documented inline rather than papered over.
 */

/* ------------------------------------------------------------------ cues -- */

/** presentationSchema.cues[].cueType enum. See src/server/utils/cueType.js. */
export type CueType = "visual" | "audio"

/**
 * Media file metadata, i.e. the `cues[].file` subdocument.
 *
 * Every field is optional because the subdocument itself is optional and the
 * S3 updateCue path rebuilds it from scratch (see the note on `type` below).
 */
export interface CueFileMeta {
  id?: string
  name?: string
  url?: string
  driveId?: string
  /** String, not number — the schema declares `size: { type: String, default: "0" }`. */
  size?: string
  /**
   * MIME type. Schema default is "image/jpeg".
   *
   * TODO(ts): the S3 updateCue route reassigns `cue.file = { id, name, url }`,
   * dropping type/size/driveId, after which Mongoose re-applies the "image/jpeg"
   * default. So a replaced mp4 comes back claiming to be an image. Read sites
   * must not assume this is accurate or even present.
   */
  type?: string
  /**
   * TODO(ts): CLIENT/SERVER DISAGREEMENT. Read by Screen.jsx
   * (`file.mimeType || "audio/mpeg"`) and EditMode.jsx
   * (`cue.file?.type || cue.file?.mimeType`), but presentationSchema has no
   * `mimeType` field and no route ever writes one — it is always undefined and
   * those fallbacks are dead. Kept optional to preserve behaviour; verify before
   * deleting the read sites.
   */
  mimeType?: string
}

/**
 * A cue as returned by the API.
 *
 * Note `_id` survives here: the presentation toJSON transform only rewrites the
 * top-level document, so cue subdocuments keep their `_id`. Client-side filters
 * such as `cue._id !== action.payload` depend on this.
 */
export interface Cue {
  _id: string
  cueType: CueType
  index: number
  name: string
  screen: number
  /**
   * Screens this cue's image spans across (visual cues only), in addition to
   * `screen`, its primary/grid position. Present only when the cue actually
   * spans more than one screen -- absent, not an empty array, means "no span".
   */
  spanScreens?: number[]
  color?: string
  file: CueFileMeta | null
  loop: boolean
  continuePlayback: boolean
  opacity: number
  layer: number
}

/* --------------------------------------------------------------- scores -- */

export type ScoreSource = "upload" | "imslp"

export interface ScoreFileMeta {
  id?: string
  name?: string
  url?: string
  proxyUrl?: string
  driveId?: string
  size?: string
  type?: string
}

export interface ScoreMarkerRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ScoreMarker {
  _id: string
  page: number
  frameIndex: number
  measureLabel?: string
  note?: string
  rect?: ScoreMarkerRect
}

export interface ScoreDocument {
  _id: string
  title: string
  source: ScoreSource
  sourceUrl?: string
  imslpId?: string
  pageCount?: number
  file?: ScoreFileMeta
  markers: ScoreMarker[]
  createdAt?: string
}

/* --------------------------------------------------------- presentations -- */

/** presentationSchema.storage enum. */
export type StorageBackend = "aws" | "googleDrive"

/**
 * A presentation as returned by GET /api/presentation/:id.
 *
 * `id`, not `_id`: the toJSON transform does
 * `returnedObject.id = _id.toString(); delete returnedObject._id`.
 */
export interface Presentation {
  id: string
  name: string
  description?: string
  /** Owner user id. */
  user: string
  storage: StorageBackend
  screenCount: number
  indexCount: number
  /** ISO date string. */
  lastUsed: string
  cues: Cue[]
  previewCue?: Cue
  scores?: ScoreDocument[]
  /**
   * The presentation's media library -- the editor's "media pool". Absent on
   * responses from a server that predates it, and on documents created before
   * the field existed, so every read site must tolerate undefined.
   */
  media?: MediaLibraryItem[]
  /**
   * TODO(ts): injected by the toJSON transform
   * (`returnedObject.audioCues = cues.filter(c => c.cueType === "audio")`),
   * but no client read site was found. Optional so it neither has to be
   * constructed nor is assumed present.
   */
  audioCues?: Cue[]
  createdAt: string
  updatedAt: string
}

/** Shape used by the homepage list (GET /api/home/). */
export type PresentationSummary = Pick<
  Presentation,
  "id" | "name" | "screenCount" | "lastUsed"
> &
  Partial<Presentation>

/**
 * Body sent to POST /api/home/ by homepage/PresentationForm.
 *
 * A plain JSON object, not FormData: the presentation itself carries no media
 * at creation time. `startingFrameColor` is client-only input used to seed the
 * first cue and has no counterpart on the Presentation document.
 */
export interface CreatePresentationInput {
  name: string
  description: string
  screenCount: number
  startingFrameColor: string
}

/** Body sent to PUT /api/home/:id by homepage/PresentationsGrid. */
export interface UpdatePresentationInput {
  name: string
  description: string
}

/* ------------------------------------------------------------------ auth -- */

/**
 * The object stored in localStorage["user"] and returned by POST /api/login.
 * See src/server/routes/login.js.
 */
export interface AuthUser {
  token: string
  username: string
  isAdmin: boolean
  id: string
  driveToken: string | null
  /**
   * TODO(ts): CLIENT/SERVER DISAGREEMENT. login.js sends `name: user.name`, but
   * userSchema has no `name` field — this is always undefined on the wire.
   * Removing it is a server-side change, out of scope for the TS migration.
   */
  name?: string
}

/**
 * A user as returned by the admin endpoints (GET /api/admin, PUT
 * /api/admin/makeadmin/:id), i.e. userSchema's toJSON output. The transform
 * deletes _id, __v, passwordHash, refreshTokenHash and refreshTokenExpires, so
 * what is left is this.
 *
 * Distinct from AuthUser, which is the login response and carries a token.
 */
export interface AdminUser {
  id: string
  username: string
  isAdmin: boolean
  driveToken: string | null
  /** Present only for Firebase-authenticated accounts (the field is sparse). */
  firebaseUid?: string
  /** Presentation ids; not populated by the admin routes. */
  presentations: string[]
}

/** Body sent to POST /api/login and POST /api/signup. */
export interface Credentials {
  username: string
  password: string
}

/** Body sent to POST /api/users/change-password. */
export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/** GET /api/signup/check-username */
export interface UsernameAvailability {
  available: boolean
}

/* --------------------------------------------------------- media library -- */

/**
 * One entry in a presentation's media library.
 *
 * Same shape as CueFileMeta plus `_id`/`createdAt`, because it is stored the
 * same way and under the same key. `id` is the storage handle: a cue created
 * from this entry copies it verbatim, so both point at the same stored object.
 *
 * `url` is a presigned URL regenerated on every read and valid for a few hours
 * -- never persist it, never treat a stale one as usable.
 */
export interface MediaLibraryItem {
  /** Mongo subdocument id. Identifies the library entry itself. */
  _id?: string
  /** Storage handle, shared with any cue created from this entry. */
  id: string
  name: string
  url?: string
  driveId?: string
  /** String, not number -- the schema declares `size: { type: String }`. */
  size?: string
  type?: string
  createdAt?: string
}

/* --------------------------------------------------------------- uploads -- */

/**
 * A file being uploaded with a cue.
 *
 * An intersection, deliberately NOT a `File | DriveFileDescriptor` union: the
 * code never branches on which one it holds, it only ever reads `file.driveId &&`
 * and `file.name`. EditMode's createNewCueData decorates a real File returned by
 * fetchFileFromUrl with a driveId, which is exactly what this describes.
 */
export type CueUploadFile = File & { driveId?: string }

/** The named arguments assembled before being flattened into createFormData. */
export interface CueUpdateInput {
  index: number
  cueName: string
  screen: number
  /**
   * Either a File being uploaded, or the stored metadata of the cue's existing
   * file when an update only changes a flag.
   *
   * TODO(ts): the two shapes go through the same field and the same
   * createFormData argument. On the metadata path the object is appended to the
   * FormData as-is, which serialises to "[object Object]" and multer reads as a
   * text field, leaving the stored file untouched -- which is the intent, by
   * accident rather than by design. Splitting the two paths is a server-contract
   * change, so the type records the reality instead.
   */
  file: CueUploadFile | CueFileMeta | null
  cueId?: string
  /** Present on the create path, which builds the payload from a lane. */
  cueType?: CueType
  fileName?: string | null
  color?: string
  loop?: boolean
  layer?: number
  opacity?: number
  continuePlayback?: boolean
  /**
   * Id of an existing media-library entry to build the cue from, instead of
   * uploading a file. Mutually exclusive with a File in `file`: the server
   * reuses the entry's stored object rather than writing a new one.
   */
  mediaId?: string
  /**
   * See `Cue.spanScreens`. Omitted entirely means "don't touch the cue's
   * existing span"; an explicit empty array means "clear it".
   */
  spanScreens?: number[]
}

export interface UploadScoreInput {
  file: File
  title?: string
  sourceUrl?: string
  imslpId?: string
  pageCount?: number
}

export interface ImportScoreInput {
  sourceUrl: string
  title?: string
  imslpId?: string
  pageCount?: number
}

export interface ScoreMarkerInput {
  page: number
  frameIndex: number
  measureLabel?: string
  note?: string
  rect?: ScoreMarkerRect
}

/** CuesForm media/sound pool entries. */
export interface MediaPoolItem {
  id: string
  file: File
  name: string
  type: string
  /** Object URL. Media only — absent for sounds. */
  preview?: string
}

/* ------------------------------------------------------------ drag & drop -- */

export type DragElementType = "color" | "media" | "sound"

/**
 * Payload placed on the DataTransfer (and mirrored into mediaFileStore) when
 * dragging from the media pool.
 *
 * Deliberately a FLAT interface with optional fields, not a discriminated union:
 *   - it originates from JSON.parse of DataTransfer content, so no variant is
 *     guaranteed to be well-formed;
 *   - EditMode reads `dragData.color` / `dragData.opacity` in a branch shared by
 *     the media and sound variants, which a discriminated union would correctly
 *     but unhelpfully reject. Narrowing it would mean restructuring EditMode.
 */
export interface NewCueDragData {
  type: "newCueFromForm"
  elementType: DragElementType
  cueName: string
  color?: string
  opacity?: number
  mediaId?: string
  soundId?: string
  mimeType?: string
  previewUrl?: string
}

/* -------------------------------------------------------- API payloads -- */

export interface SwapCuesPayload {
  firstCueId: string
  secondCueId: string
  firstIndex: number
  firstScreen: number
  firstLayer: number
  secondIndex: number
  secondScreen: number
  secondLayer: number
}

/** PUT /api/presentation/:id/swapCues */
export interface SwapCuesResponse {
  firstCue: Cue
  secondCue: Cue
}

/** PUT /api/presentation/:id/indexCount */
export interface SaveIndexCountResponse {
  indexCount: number
  removedCuesCount: number
  removedScoreMarkersCount?: number
}

/** PUT /api/presentation/:id/screenCount */
export interface SaveScreenCountResponse {
  screenCount: number
  removedCuesCount: number
}

/** PUT /api/presentation/:id/name */
export interface UpdateNameResponse {
  name: string
}

/** PUT /api/presentation/:id/shiftIndexes */
export interface ShiftIndexesResponse {
  shifted: boolean
}

/* ------------------------------------------------------------ row model -- */

export type LaneKind = "screen" | "layer" | "audio" | "audio-track"

/** One row of the edit-mode grid. Built by screenRowModel.js. */
export interface Lane {
  kind: LaneKind
  /** "screen-1" ... "screen-8", or "audio". */
  group: string
  screen: number
  y: number
  label: string
  layer?: number
  collapsed?: boolean
  count?: number
  laneTotal?: number
  canRemoveLayer?: boolean
  groupStart?: boolean
  screenLabel?: string
}

/**
 * The imperative callbacks the timeline header components invoke.
 *
 * EditMode reassigns this bag on every render into a ref rather than passing
 * the callbacks as props, so the memoized header components do not re-render
 * when a handler identity changes.
 */
export interface HeaderActions {
  addIndex: (index: number) => void
  removeIndex: (index: number) => void
  increaseScreenCount: () => void
  decreaseScreenCount: () => void
  toggleAudioMute: () => void
}

/**
 * One screen's (or the audio section's) contiguous run of lanes, as drawn by the
 * per-screen container in the editor.
 *
 * buildRowModel emits every group's lanes consecutively, so a group is fully
 * described by where it starts and how many lanes it spans -- no lane needs to
 * know its group's extent.
 */
export interface LaneGroup {
  /** "screen-1" ... "screen-8", or "audio". */
  group: string
  kind: LaneKind
  /** "Screen 3" / "Audio". */
  label: string
  screen: number
  startY: number
  laneCount: number
  collapsed: boolean
}

export interface RowModel {
  rows: Lane[]
  /** Cue id -> row index. */
  cueY: Record<string, number>
  rowCount: number
}

/** Group key -> collapsed. */
export type CollapsedGroups = Record<string, boolean>
/** Group key -> minimum lane count. */
export type MinimumLanes = Record<string, number>
/** Cue id -> visual span in grid columns. */
export type SpanOverrideMap = Record<string, number>

export interface LayerRemovalPlan {
  removedCueIds: string[]
  shiftedCues: Cue[]
}

export interface DropTarget {
  screen: number
  layer: number
}

/* ----------------------------------------------------------------- misc -- */

/**
 * Inline alert payload rendered by components/utils/CustomAlert, and held in
 * EditMode's alert state.
 *
 * Every field is optional because the state is initialised to an empty object
 * and filled in only when something needs announcing; CustomAlert renders
 * nothing until `title` is set.
 */
export interface AlertData {
  title?: string
  description?: string
  status?: AlertStatus
}

/** useCustomToast argument. */
export interface ToastOptions {
  title: string
  description?: string
  status: "success" | "error" | "info" | "warning" | "loading"
}

/**
 * The transition variants getAnims() branches on.
 *
 * NOTE: getAnims must keep accepting a plain `string` — the value is read from
 * localStorage and getAnims deliberately falls through to fade for anything
 * unrecognised. Narrowing its parameter to this type would change behaviour for
 * stale stored values. This type is for the transition menu's props only.
 */
export type TransitionType =
  | "fade"
  | "zoom"
  | "slide-left"
  | "slide-right"
  | "none"

/* ------------------------------------------------------------ static data -- */

/**
 * One entry of the manual/feature lists in components/data/.
 *
 * Annotated explicitly rather than inferred: several entries are written with
 * `items: []`, which TypeScript would infer as `never[]` and which would then
 * reject any string the consumer tries to read out of it.
 */
export interface FeatureSection {
  title: string
  items: string[]
}

/**
 * One step of the guided tutorial (components/data/tutorialSteps.ts).
 *
 * id, title and description are present on all 18 steps; the rest vary. Declared
 * as one interface with optional fields rather than left to inference, which
 * would produce a union that rejects `step.selector` at the read sites.
 */
export interface TutorialStep {
  id: string
  title: string
  description: string
  /** CSS selector of the element the step points at. Absent on centred steps. */
  selector?: string
  center?: boolean
  posLeftNeeded?: boolean
  /**
   * Absolute left position in px, overriding the computed placement. Used by
   * TutorialGuide in the same arithmetic as the on-screen clamping, so it is a
   * number -- the single step that sets it uses 0.
   */
  manualLeftPos?: number
}
