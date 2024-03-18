const getToken = () => JSON.parse(window.localStorage.getItem("user")).token

export default getToken
