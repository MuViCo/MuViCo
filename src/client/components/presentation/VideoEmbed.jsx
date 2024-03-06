import React from "react"
import ReactPlayer from "react-player"
import { Button } from "@chakra-ui/react"

const VideoEmbed = ({ url, id, removeVideo }) => {
  return (
    <>
      <ReactPlayer url={url} controls={true} />
      <Button mt={4} onClick={() => removeVideo(id)}>
        Remove
      </Button>
    </>
  )
}

export default VideoEmbed
