import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Render.com uchun tayyor vite.config.js
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // hamma xostlar uchun ruxsat
    port: process.env.PORT ? Number(process.env.PORT) : 5173, // Render portni env orqali beradi
    hmr: {
      overlay: false, // development warning overlay’ini o‘chiradi
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger() // faqat dev mode uchun
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // @ -> src papkasi
    },
  },
  build: {
    outDir: "dist", // production build papkasi
  },
}));
