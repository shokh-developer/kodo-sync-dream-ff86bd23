// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true, // Render serverda hamma xostlar ruxsat
    port: 3000  // Render odatda portni ENV orqali beradi
  }
})
