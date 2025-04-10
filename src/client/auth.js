const getToken = () => {
  const user = window.localStorage.getItem("user")
  return user ? JSON.parse(user).token : null
}

// return true if token is expired othewise false
const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp * 1000 < Date.now()
  } catch (e) {
    return true
  }
}

export default getToken
export { isTokenExpired }
