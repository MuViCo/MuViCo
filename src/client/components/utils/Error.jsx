import React from "react"

const Error = ({ error }) => {
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
