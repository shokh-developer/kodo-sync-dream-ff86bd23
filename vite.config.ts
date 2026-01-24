// vite.config.ts - YANGILANG
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; ← BU QATORNI O'CHIRING

export default defineConfig({
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    }
  },
  preview: {
    host: true,
    port: 8080
  },
  plugins: [
    react(),
    // mode === "development" && componentTagger() ← BU QATORNI O'CHIRING
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
});
