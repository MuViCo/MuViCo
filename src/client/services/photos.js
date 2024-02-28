import axios from "axios";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
};


const Url1 = "http://localhost:8000/api/photos";
const Url2 = "http://localhost:8000/api/photos/upload";

const photos = async () => {
  const response = await axios.get(Url1);
  return response;
};

const photosPost = async (form) => {
  const response = await axios.post(Url2, form, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: token 
    },
  });
  alert("File uploaded successfully");
  return response.data;
};

const photoContainer = async (photoName) => {
  return `http://localhost:8000/api/photos/${photoName}`;
};
export default { photos, photosPost, photoContainer, setToken };
