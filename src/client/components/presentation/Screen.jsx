import React from "react"

const Screen = ({ screenData, screenNumber, isVisible }) => {
  if (!isVisible) return null

  return (
        <div className={`screen screen-${screenNumber}`}>
            <h3>{`Screen ${screenNumber}`}</h3>
            {screenData ? (
                <div>
                    <p>{`Current Cue: ${screenData.name}`}</p>
                    {/* Render file content */}
                    {screenData.file.type === "image" && <img src={screenData.file.url} alt={screenData.name} />}
                    {screenData.file.type === "video" && <video src={screenData.file.url} controls />}
                    {screenData.file.type === "text" && <p>{screenData.file.content}</p>}
                </div>
            ) : (
                <p>No data for this cue</p>
            )}
        </div>
  )
}

export default Screen
