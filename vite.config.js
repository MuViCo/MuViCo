import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
  build: {
    outDir: 'dist',
    sourcemap: true,
    base: '/',
    terserOptions: {
      compress: {
        drop_console: true,
        // Any other options for Terser
      },
      // Any other options for Terser
    },
    // Configure the bundle splitting
    chunkSizeWarningLimit: 500, // Adjust according to your project's requirements
    // Configure CSS extraction
    cssCodeSplit: true,
    // Whether to enable brotli compression for assets
    brotliSize: true,
    // Rollup plugins configuration (if needed)
    rollupOptions: {
      // Any additional rollup plugins or options
    },
  }
})
