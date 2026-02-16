import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://haruauth.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
