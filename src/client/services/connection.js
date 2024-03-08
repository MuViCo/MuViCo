import axios from "axios";
const baseUrl = "/api/connections";

const create = async () => {
  const response = await axios.post(`${baseUrl}/createserver`);
  console.log("response", response.data);
  return response.data;
};

const connect = async () => {
  const response = await axios.post(`${baseUrl}/connect`);
  console.log("response", response.data);
  return response.data;
};

export default { create, connect };
