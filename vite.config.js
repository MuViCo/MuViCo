import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

//import { BASE_PATH } from './src/config'

export default defineConfig({
  plugins: [react()],
 // base: BASE_PATH,
  server: {
    proxy: {
      '/api/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 3000,
  },
  define: {
    'process.env': process.env,
  },
  resolve: {
    alias: {
      '/src/client/main': path.resolve(__dirname, 'src/client/main'),
    },
  }
})
