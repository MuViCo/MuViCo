import dotenv from 'dotenv';
dotenv.config();

const config = {
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID,
  };
  
export default config;