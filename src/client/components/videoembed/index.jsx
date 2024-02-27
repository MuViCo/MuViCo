import React from "react";
import ReactPlayer from "react-player";

const VideoEmbed = ({ url }) => {
  return <ReactPlayer url={url} controls={true}/>;
}

export default VideoEmbed;