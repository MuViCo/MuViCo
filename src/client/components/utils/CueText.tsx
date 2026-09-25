import { normalizeTextColor, normalizeTextSize } from "./cueText"

interface CueTextProps {
  text: string
  color?: string
  size?: number
}

const CueText = ({ text, color, size }: CueTextProps) => (
  <div
    data-testid="cue-text"
    style={{
      position: "absolute",
      inset: 0,
      containerType: "size",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    }}
  >
    <span
      style={{
        color: normalizeTextColor(color),
        ["--cue-text-size" as string]: normalizeTextSize(size),
        fontSize: "calc(var(--cue-text-size) * 1cqh)",
        lineHeight: 1.2,
        textAlign: "center",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        maxWidth: "92%",
      }}
    >
      {text}
    </span>
  </div>
)

export default CueText
