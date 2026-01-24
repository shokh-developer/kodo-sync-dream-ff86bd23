# Terminalda:
# 1. TypeScript config ni JavaScript ga o'zgartirish:
mv vite.config.ts vite.config.js

# 2. Yangi vite.config.js yaratish:
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
