import axios from "axios";

const Url = "http://localhost:8000/api/login";

const login = async (credentials) => {
  const response = await axios.post(Url, credentials);
  return response.data;
};

export default { login };
