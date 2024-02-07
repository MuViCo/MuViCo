const Error = ({ error }) => {
  if (error) {
    return <div style={{ color: "red", paddingTop: "5px" }}>{error}</div>
  }
  return null
}

export default Error
