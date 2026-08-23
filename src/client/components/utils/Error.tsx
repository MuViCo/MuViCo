/** Error.tsx
 * A reusable error component.
 */

import type { ReactNode } from "react"

const Error = ({ error }: { error?: ReactNode }) => {
  if (error) {
    return (
      <div
        style={{
          color: "#D2042D",
          paddingTop: "5px",
          textAlign: "left",
          fontSize: "14px",
        }}
      >
        {error}
      </div>
    )
  }
  return null
}

export default Error
