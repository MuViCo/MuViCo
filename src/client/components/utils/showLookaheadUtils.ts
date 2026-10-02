// Which frame indices to preload media for while a show is on `cueIndex`,
// so playback never waits on media that hasn't been fetched yet. The window
// spans both directions: autoplay only ever steps forward, but a manual
// show jumps backwards too, and a cold frame costs a full load cycle.
export const getLookaheadFrameIndices = (
  cueIndex: number,
  indexCount: number,
  lookaheadFrames: number
): number[] => {
  const indices: number[] = []
  const lastIndex = indexCount - 1

  for (let offset = lookaheadFrames; offset >= 1; offset -= 1) {
    const index = cueIndex - offset
    if (index >= 0 && index <= lastIndex) indices.push(index)
  }

  for (let offset = 1; offset <= lookaheadFrames; offset += 1) {
    const index = cueIndex + offset
    if (index > lastIndex) break
    indices.push(index)
  }

  return indices
}
