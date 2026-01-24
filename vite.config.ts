# 1. Buzilgan config ni o'chiring:
rm vite.config.ts

# 2. Yangi JavaScript config yarating:
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  server: {
    host: true,
    port: 8080
  },
  preview: {
    host: true,
    port: 8080
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist'
  }
})
EOF
