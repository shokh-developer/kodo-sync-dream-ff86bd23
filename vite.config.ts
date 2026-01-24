{
  "name": "codeforge",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "vite preview --port $PORT"
  },
  "dependencies": {
    // 1. VITE BIRINCHI!
    "vite": "^5.4.19",
    "@vitejs/plugin-react-swc": "^3.11.0",
    
    // 2. REACT
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    
    // 3. ROUTING
    "react-router-dom": "^6.30.1",
    
    // 4. CODE EDITOR
    "@monaco-editor/react": "^4.7.0",
    
    // 5. STATE MANAGEMENT
    "@tanstack/react-query": "^5.83.0",
    
    // 6. TAILWINDCSS
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss-animate": "^1.0.7",
    
    // 7. UTILITIES
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    
    // 8. UI COMPONENTS (asosiylari)
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-button": "^1.1.11",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-tooltip": "^1.2.7",
    
    // 9. FORMS
    "react-hook-form": "^7.61.1",
    "zod": "^3.25.76",
    "@hookform/resolvers": "^3.10.0",
    
    // 10. ICONS
    "lucide-react": "^0.462.0"
  }
}
