import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    host: true, // hamma xostlarga ruxsat
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
    allowedHosts: ["codeforgeuz.onrender.com"], // shu xostga ruxsat
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
}));
