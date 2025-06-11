import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Adicione esta secção para corrigir o erro de CSP
  build: {
    sourcemap: 'inline',
  },
})