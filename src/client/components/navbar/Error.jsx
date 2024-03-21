import React from "react"

const Error = ({ error }) => {
  if (error) {
    return (
      <div style={{ color: "red", paddingTop: "5px", textAlign: "left" }}>
        {error}
      </div>
    )
  }
  return null
}

export default Error
