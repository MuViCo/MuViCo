import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();

const devPort =
  process.env.NODE_ENV === "development" ? process.env.VITE_DEV_PORT : 8000;

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: {
      "/api/": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: devPort || 8000,
  },
  build: {
    manifest: true,
  },
  define: {
    'process.env': {
      VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
      VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MEASSAGE_ID: process.env.VITE_FIREBASE_MEASSAGE_ID,
      VITE_FIREBASE_MESURMENT_ID: process.env.VITE_FIREBASE_MESURMENT_ID,
    },
  },
});
