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
});
