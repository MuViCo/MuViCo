# Show mode

Notes for contributors working on the performance side of MuViCo: the
workspace an operator drives a concert from, the output windows it feeds,
and the media pipeline that keeps both of them off the network once the
curtain is up.

This document explains the reasoning, not the line-by-line implementation.
Where a rule exists because something broke, the symptom is recorded —
those are the parts most likely to be undone by accident.

---

## 1. What show mode is for

Edit mode is a workbench: cues are placed on a grid, media is fetched from
object storage whenever a component happens to need it, and a stutter costs
nothing. Show mode is a performance instrument. It runs on stage, often on
a venue's network, and a hiccup is visible to an audience.

That difference drives every decision below. **Edit mode may talk to the
network freely. A running show must not.**

---

## 2. The two workspaces

Show mode is a single React tree (`ShowMode.tsx`) that presents one of two
layouts, selected by the `view` state (`"music" | "control"`):

**Music stand** — built for the performer. A large score viewer dominates,
with transport controls sized to be hit without looking and a compact
preview of the outputs off to one side. Page turns can follow the cue index
automatically.

**Control room** — built for the operator. A wall of output previews, a
preview of the _next_ frame, and the cue list. Nothing is large; everything
is visible at once.

A third surface, the **monitor window** (`ShowMonitorWindow.tsx`), detaches
either the score or the screen wall into its own browser window, so a second
person can watch on a second display.

These are views over shared state, not separate modes. Switching between
them never interrupts playback, reloads media, or touches the outputs.

---

## 3. Entering a show: the media gate

`handleEnterShow` in `EditModeContainer.tsx` is the doorway. Before show
mode opens, it walks every media file the presentation references and pulls
each one into the browser, four at a time
(`SHOW_PRELOAD_CONCURRENCY = 4`). A progress overlay covers the editor
while this runs, and only appears when something is genuinely missing — a
second entry resolves from cache and opens without a flash.

The sequence is deliberate: **all the network cost is paid here, visibly,
while the stage is still empty.** Everything the rest of this document
describes follows from that choice.

Entry is also the only moment a frozen file is revalidated. See §4.

> Diagrams: `show-mode-1-preparation.puml`, `show-mode-2-presentation.puml`.

---

## 4. The media cache

`freezeMediaUrl` is the single entry point for obtaining a playable media
reference. It layers three stores:

| Layer                 | Lifetime                   | Keyed by     |
| --------------------- | -------------------------- | ------------ |
| In-memory promise map | the page session           | original URL |
| Object URL (Blob)     | the page session           | original URL |
| Cache Storage         | across reloads and windows | **media id** |

The Cache Storage bucket is named `muvico-show-media-v1-<presentationId>`,
and the last `MEDIA_DISK_CACHE_KEEP = 3` presentations are retained so that
alternating between two shows does not re-download either.

### Why entries are keyed by media id, not URL

Object storage hands out presigned URLs, and a fresh one is minted every
time a presentation is read. Keying the durable store by URL would miss on
every page load. The id is stable; the URL is not. The in-memory layers may
safely use the URL, because they do not outlive the page.

### Revalidation policy

A frozen file is checked for staleness with a one-byte ranged request,
comparing `ETag`, `Last-Modified`, and the resource size. Two rules govern
when that check may run:

1. **Never during a show.** `freezeMediaUrl` returns the cached copy
   immediately while `isShowMode` is set.
2. **Outside a show, at most every `MEDIA_VALIDATION_MIN_INTERVAL_MS`**
   (15 s) per file.

Rule 1 exists because of a measured failure. The check used to run on a
timer regardless of context; when it concluded a file had moved, it revoked
the Blob and deleted the disk copy mid-performance. Every element pointing
at that Blob fell back to the live URL and began streaming over the network.
A trace of one presentation showed **32.1 MB pulled across 37 requests**
where edit mode, on the same material, served 49 requests from Blobs and
0.1 MB from the wire. Two scenes were downloaded in full a second time, 46
and 69 seconds into the show.

Staleness is therefore detected at show entry — overlay up, stage empty —
or not at all. Media swapped under an unchanged URL mid-performance is not
a case worth a black frame.

### A subtlety worth knowing

On a `206 Partial Content` response, `Content-Length` describes the
requested slice, not the resource. The size comparison reads the total from
`Content-Range` instead. Reading the former made a one-byte probe report
`"1"` against a stored `"8873575"`, so any file served without an `ETag`
was evicted on every single revalidation.

### Failure behaviour

If freezing fails — network error, CORS, an expired token — the original
URL is returned and the file is flagged. Playback degrades to streaming
rather than stopping. Contributors should preserve that: the pipeline is an
optimisation, never a prerequisite.

---

## 5. Staying ahead during the show

While a frame is on screen, `getLookaheadFrameIndices` names the next
`SHOW_LOOKAHEAD_FRAMES = 2` and warms their media through the same
`freezeMediaUrl`.

This costs nothing in practice, and understanding why matters: the entry
gate has already fetched everything, so look-ahead resolves to a cache hit.
It is a lookup, not a download. The mechanism earns its keep in the margins
— a cue added after entry, or a race with the initial pass.

---

## 6. Output windows

Each screen is a browser window opened by `Screen.tsx` and filled through a
React portal. The windows share the opener's JavaScript context, which is
what lets a Blob created in the editor be read by an output without any
cross-window messaging.

Three traps have already been paid for here.

**Theme tokens do not cross the boundary.** Chakra resolves `bg="black"` to
a CSS custom property that `ChakraProvider` defines on the opener's
document. An output receives those declarations only through copied style
tags, which are empty in a production build because Emotion inserts rules
via `CSSStyleSheet.insertRule`. Layout props survive the copy; colour props
evaporate. Letterboxed cues sat in a white frame and the blackout overlay
rendered transparent. The stage, the blackout, and the popup document
itself are therefore painted with literal values, inline.

**An output only takes a frame when its key changes.** Outputs mirror their
cue stack into local state and compare `cueStackKey` to decide whether
anything moved. Any field that alters what gets drawn must appear in that
key. A field left out is a change the outputs silently ignore, however many
times the editor re-renders — the symptom is "the preview updates but the
windows don't, until I reload".

**Timing must use wall-clock.** `performance.now()` has a distinct time
origin per window, so a transition scheduled with it lands at different
moments on different screens. `syncedTransition.ts` schedules against
`Date.now()`.

---

## 7. Media spanning several screens

A cue may stretch across adjacent outputs. `screenSpanLayout.ts` holds the
geometry, as pure functions with no React dependency.

Spanned screens form one **canvas**. Each contributes its own measured
stage box; the tallest sets the canvas height, and a shorter neighbour
covers a centred band of it — which is what it physically shows. Assuming a
uniform height produced the obvious artefact: a 4:3 output beside a 16:9
one, or two differently sized windows, left the halves at different scales
and different vertical offsets.

Outputs report their stage through a `ResizeObserver`. Observing the element
rather than the window follows the letterboxing and fires only on a real
size change. The editor previews feed the same functions with ratios against
a unit height, since every tile there is drawn the same size.

Two settings control the result, exposed identically by the screen picker
and the cue editor (`SpanFramingPicker.tsx`):

- **Fill** scales until the media covers the canvas, cropping the
  overflowing axis. This is the default.
- **Fit** scales until it fits, leaving bands on the short axis.
- A **nine-point anchor** decides which part the crop keeps, or where the
  bands fall.

Per-screen framing (`cue.frame`) does not apply to a spanning cue —
positioning it within one screen's ninth is meaningless once it covers
several. The value is retained rather than cleared, so removing the span
restores the previous placement, and the editor withholds the drag handle
to avoid offering an edit with no effect.

### Keeping spanned video aligned

Two `<video>` elements showing halves of one clip drift apart. The
correction lives in `videoSpanSync.ts` and is deliberately gentle.

Writing `currentTime` flushes the decoder. On software-decoded material the
recovery outlasted the one-second sync interval, so each tick seeked again:
seeks locked to the interval, recovery growing 170 ms → 1450 ms, `waiting`
emitted in the same millisecond as every `seeking`. The correction was
manufacturing the drift it was meant to remove.

Today, drift under `DRIFT_THRESHOLD_SECONDS` (0.5 s) is absorbed by a 2 %
`playbackRate` adjustment, imperceptible and never touching the decoder.
A follower below `HAVE_FUTURE_DATA` is skipped outright — seeking a stream
that cannot render its next frame widens the gap.

---

## 8. Invariants

Changes to show mode should preserve these. Each has a measured failure
behind it.

- A running show performs no network request for media.
- Revalidation happens at show entry, never during a performance.
- Any cue field affecting what an output draws belongs in `cueStackKey`.
- Colours rendered into an output are literal values, not theme tokens.
- Cross-window timing uses `Date.now()`.
- A media pipeline failure degrades to streaming; it never blocks playback.
- Span geometry is derived from measured stage boxes, not assumed ones.

---

## 9. File map

| Concern                                               | Location                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| Entry gate, freeze pipeline, look-ahead               | `presentation/EditModeContainer.tsx`                        |
| Workspace layout, view switching, transport, cue list | `presentation/ShowMode.tsx`                                 |
| Score viewer and output previews                      | `presentation/ShowScoreViewer.tsx`, `ShowScreenPreview.tsx` |
| Detached monitor                                      | `presentation/ShowMonitorWindow.tsx`                        |
| Output windows                                        | `presentation/Screen.tsx`                                   |
| Span geometry                                         | `utils/screenSpanLayout.ts`                                 |
| Spanned video alignment                               | `utils/videoSpanSync.ts`                                    |
| Cross-window transition timing                        | `utils/syncedTransition.ts`                                 |
| Framing controls                                      | `presentation/SpanFramingPicker.tsx`                        |

Diagrams accompanying this document live alongside it:
`show-mode-1-preparation.puml` and `show-mode-2-presentation.puml`.
