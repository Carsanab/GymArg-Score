import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // ← ESTO ES CLAVE: permite conexiones desde la red
    port: 5173,
    strictPort: true,
  },
})