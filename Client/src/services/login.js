import axios from "axios";

const Url = "http://localhost:3000/login";

const login = async (credentials) => {
  const response = await axios.post(Url, credentials);
  return response.data;
};

export default { login };
