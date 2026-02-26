import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, Terminal as TerminalIcon, ChevronUp, ChevronDown, Loader2, Keyboard } from "lucide-react";
import { MangaButton } from "./MangaButton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  is_folder: boolean;
}

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  code: string;
  language: string;
  files?: FileItem[];  // All files for linking support
  activeFile?: FileItem | null;
}

interface LogEntry {
  type: "log" | "error" | "warn" | "info" | "result" | "compile";
  content: string;
  timestamp: Date;
}

// Languages that can run in browser (with linked support)
const browserLanguages = ["javascript", "html", "css", "scss", "sass", "sql", "react", "vue", "svelte", "angular", "nextjs"];

// Frameworks handled via StackBlitz
const frameworkLanguages = ["react", "vue", "svelte", "angular", "nextjs"];

// Languages supported by backend
const backendLanguages = ["javascript", "typescript", "python", "cpp", "c", "java", "go", "rust", "php", "ruby", "csharp", "nodejs"];

// Languages that typically need input
const inputLanguages = ["cpp", "c", "python", "java", "go", "rust", "csharp"];

// File extensions to language mapping
const getLanguageFromExt = (ext: string): string => {
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    mjs: "nodejs",
    cjs: "nodejs",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    vue: "vue",
    svelte: "svelte",
    sql: "sql",
    php: "php",
    py: "python",
    cpp: "cpp",
    c: "c",
    java: "java",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    cs: "csharp",
  };
  return map[ext] || "plaintext";
};

const Terminal = ({ isOpen, onToggle, code, language, files, activeFile }: TerminalProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [stdinInput, setStdinInput] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const addLog = (type: LogEntry["type"], content: string) => {
    setLogs((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  const getRuntimeLanguage = () => {
    const name = activeFile?.name?.toLowerCase() || "";
    const path = activeFile?.path?.toLowerCase() || "";

    if (name.endsWith(".vue")) return "vue";
    if (name.endsWith(".svelte")) return "svelte";
    if (name.endsWith(".component.ts") || name.endsWith(".component.html")) return "angular";
    if (name.endsWith(".jsx") || name.endsWith(".tsx")) {
      if (
        name === "page.tsx" ||
        name === "page.jsx" ||
        name === "layout.tsx" ||
        name === "layout.jsx" ||
        path.includes("/pages/") ||
        path.includes("/app/")
      ) {
        return "nextjs";
      }
      return "react";
    }
    if (name.endsWith(".scss") || name.endsWith(".sass")) return "sass";
    if (name.endsWith(".sql")) return "sql";
    if (name.endsWith(".php")) return "php";
    if (name.endsWith(".mjs") || name.endsWith(".cjs")) return "nodejs";

    return language;
  };

  // Check if code contains input functions
  const codeNeedsInput = (lang: string) => {
    if (lang === "cpp" || lang === "c") {
      return /\b(cin|scanf|gets|getline|getchar)\b/.test(code);
    }
    if (lang === "python") {
      return /\binput\s*\(/.test(code);
    }
    if (lang === "java") {
      return /\bScanner\b/.test(code);
    }
    return false;
  };

  // Find linked files (CSS/JS for HTML, etc.)
  const findLinkedFiles = () => {
    if (!files || !activeFile) return { css: [], js: [] };

    const currentPath = activeFile.path;
    const linkedCss: FileItem[] = [];
    const linkedJs: FileItem[] = [];

    // Find files in the same directory
    files.forEach(file => {
      if (file.is_folder || file.id === activeFile.id) return;
      if (file.path !== currentPath) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'css' || ext === 'scss' || ext === 'sass') {
        linkedCss.push(file);
      } else if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') {
        linkedJs.push(file);
      }
    });

    // Also check HTML for linked files via src/href attributes
    if (language === 'html') {
      const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;
      const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;

      let match;
      while ((match = linkRegex.exec(code)) !== null) {
        const fileName = match[1].split('/').pop();
        const linkedFile = files.find(f => f.name === fileName && !f.is_folder);
        if (linkedFile && !linkedCss.find(c => c.id === linkedFile.id)) {
          linkedCss.push(linkedFile);
        }
      }

      while ((match = scriptRegex.exec(code)) !== null) {
        const fileName = match[1].split('/').pop();
        const linkedFile = files.find(f => f.name === fileName && !f.is_folder);
        if (linkedFile && !linkedJs.find(j => j.id === linkedFile.id)) {
          linkedJs.push(linkedFile);
        }
      }
    }

    return { css: linkedCss, js: linkedJs };
  };

  const collectProjectFiles = () => {
    const map: Record<string, string> = {};
    if (!files) return map;
    files.forEach((file) => {
      if (file.is_folder) return;
      const relPath = (file.path + file.name).replace(/^\/+/, "");
      map[relPath] = file.content || "";
    });
    return map;
  };

  const openStackblitzProject = async (project: any, openFile: string) => {
    try {
      const sdk: any = await import("@stackblitz/sdk");
      await sdk.openProject(project, { openFile, newWindow: true });
    } catch (err: any) {
      console.error("StackBlitz open error:", err);
      window.open("https://stackblitz.com/", "_blank");
    }
  };

  const buildReactProject = () => {
    const userFiles = collectProjectFiles();
    const isTsx = activeFile?.name?.toLowerCase().endsWith(".tsx");
    const appFile = isTsx ? "src/App.tsx" : "src/App.jsx";
    const mainFile = isTsx ? "src/main.tsx" : "src/main.jsx";
    const openFile = appFile;

    const defaults: Record<string, string> = {
      "package.json": JSON.stringify(
        {
          name: "codeforge-react",
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            vite: "^5.4.0",
            "@vitejs/plugin-react": "^4.3.0",
          },
        },
        null,
        2
      ),
      "vite.config.js": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});`,
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeForge React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${mainFile}"></script>
  </body>
</html>`,
      [mainFile]: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./${isTsx ? "App.tsx" : "App.jsx"}";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}`,
      [appFile]: `import "./App.css";

export default function App() {
  return (
    <div className="app">
      <h1>React ishlayapti</h1>
      <p>CodeForge live preview</p>
    </div>
  );
}`,
      "src/index.css": `:root { font-family: system-ui, sans-serif; }
body { margin: 0; background: #0b0b0f; color: #f5f5f5; }
.app { padding: 32px; }`,
      "src/App.css": `.app h1 { color: #f97316; }`,
    };

    if (!userFiles[appFile] && activeFile?.content) {
      defaults[appFile] = activeFile.content;
    }

    return {
      project: {
        title: "CodeForge React",
        description: "React live preview",
        template: "node",
        files: { ...defaults, ...userFiles },
      },
      openFile,
    };
  };

  const buildVueProject = () => {
    const userFiles = collectProjectFiles();
    const appFile = "src/App.vue";
    const openFile = appFile;

    const defaults: Record<string, string> = {
      "package.json": JSON.stringify(
        {
          name: "codeforge-vue",
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            vue: "^3.5.0",
          },
          devDependencies: {
            vite: "^5.4.0",
            "@vitejs/plugin-vue": "^5.2.0",
          },
        },
        null,
        2
      ),
      "vite.config.js": `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});`,
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeForge Vue</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
      "src/main.js": `import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");`,
      [appFile]: `<template>
  <main class="app">
    <h1>Vue ishlayapti</h1>
    <p>CodeForge live preview</p>
  </main>
</template>

<style scoped>
.app { font-family: system-ui, sans-serif; padding: 32px; color: #fff; background: #0b0b0f; min-height: 100vh; }
h1 { color: #22c55e; }
</style>`,
    };

    if (!userFiles[appFile] && activeFile?.content) {
      defaults[appFile] = activeFile.content;
    }

    return {
      project: {
        title: "CodeForge Vue",
        description: "Vue live preview",
        template: "node",
        files: { ...defaults, ...userFiles },
      },
      openFile,
    };
  };

  const buildSvelteProject = () => {
    const userFiles = collectProjectFiles();
    const appFile = "src/App.svelte";
    const openFile = appFile;

    const defaults: Record<string, string> = {
      "package.json": JSON.stringify(
        {
          name: "codeforge-svelte",
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            svelte: "^5.0.0",
          },
          devDependencies: {
            vite: "^5.4.0",
            "@sveltejs/vite-plugin-svelte": "^3.1.0",
          },
        },
        null,
        2
      ),
      "vite.config.js": `import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
});`,
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeForge Svelte</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
      "src/main.js": `import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app"),
});

export default app;`,
      [appFile]: `<script>
  let count = 0;
</script>

<main class="app">
  <h1>Svelte ishlayapti</h1>
  <button on:click={() => count += 1}>Klik: {count}</button>
</main>

<style>
  .app { font-family: system-ui, sans-serif; padding: 32px; color: #fff; background: #0b0b0f; min-height: 100vh; }
  h1 { color: #f43f5e; }
</style>`,
    };

    if (!userFiles[appFile] && activeFile?.content) {
      defaults[appFile] = activeFile.content;
    }

    return {
      project: {
        title: "CodeForge Svelte",
        description: "Svelte live preview",
        template: "node",
        files: { ...defaults, ...userFiles },
      },
      openFile,
    };
  };

  const buildAngularProject = () => {
    const userFiles = collectProjectFiles();
    const openFile = "src/app/app.component.ts";

    const defaults: Record<string, string> = {
      "package.json": JSON.stringify(
        {
          name: "codeforge-angular",
          private: true,
          scripts: {
            start: "ng serve --host 0.0.0.0 --port 4200",
            build: "ng build",
          },
          dependencies: {
            "@angular/animations": "^17.3.0",
            "@angular/common": "^17.3.0",
            "@angular/compiler": "^17.3.0",
            "@angular/core": "^17.3.0",
            "@angular/forms": "^17.3.0",
            "@angular/platform-browser": "^17.3.0",
            "@angular/platform-browser-dynamic": "^17.3.0",
            "@angular/router": "^17.3.0",
            rxjs: "^7.8.1",
            tslib: "^2.6.2",
            "zone.js": "^0.14.4",
          },
          devDependencies: {
            "@angular/cli": "^17.3.0",
            "@angular/compiler-cli": "^17.3.0",
            typescript: "^5.4.0",
          },
        },
        null,
        2
      ),
      "angular.json": `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "projects": {
    "codeforge-angular": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/codeforge-angular",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.css"],
            "scripts": []
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "buildTarget": "codeforge-angular:build"
          }
        }
      }
    }
  }
}`,
      "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": false,
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}`,
      "tsconfig.app.json": `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.ts", "src/**/*.html"]
}`,
      "src/index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CodeForge Angular</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>`,
      "src/main.ts": `import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));`,
      "src/app/app.module.ts": `import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent],
})
export class AppModule {}`,
      "src/app/app.component.ts": `import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "Angular ishlayapti";
}`,
      "src/app/app.component.html": `<main class="app">
  <h1>{{ title }}</h1>
  <p>CodeForge live preview</p>
</main>`,
      "src/app/app.component.css": `.app { font-family: system-ui, sans-serif; padding: 32px; color: #fff; background: #0b0b0f; min-height: 100vh; }
h1 { color: #38bdf8; }`,
      "src/styles.css": `:root { font-family: system-ui, sans-serif; }
body { margin: 0; }`,
    };

    if (activeFile?.content) {
      const name = activeFile.name.toLowerCase();
      if (name.endsWith(".component.html") && !userFiles["src/app/app.component.html"]) {
        defaults["src/app/app.component.html"] = activeFile.content;
      }
      if (name.endsWith(".component.ts") && !userFiles["src/app/app.component.ts"]) {
        defaults["src/app/app.component.ts"] = activeFile.content;
      }
    }

    return {
      project: {
        title: "CodeForge Angular",
        description: "Angular live preview",
        template: "angular",
        files: { ...defaults, ...userFiles },
      },
      openFile,
    };
  };

  const buildNextProject = () => {
    const userFiles = collectProjectFiles();
    const isTsx = activeFile?.name?.toLowerCase().endsWith(".tsx");
    const pageFile = isTsx ? "pages/index.tsx" : "pages/index.jsx";
    const openFile = pageFile;

    const defaults: Record<string, string> = {
      "package.json": JSON.stringify(
        {
          name: "codeforge-next",
          private: true,
          scripts: {
            dev: "next dev -p 3000",
            build: "next build",
            start: "next start -p 3000",
          },
          dependencies: {
            next: "^14.2.0",
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
        },
        null,
        2
      ),
      [pageFile]: `export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32 }}>
      <h1>Next.js ishlayapti</h1>
      <p>CodeForge live preview</p>
    </main>
  );
}`,
    };

    if (isTsx) {
      defaults["tsconfig.json"] = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`;
    }

    if (!userFiles[pageFile] && activeFile?.content) {
      defaults[pageFile] = activeFile.content;
    }

    return {
      project: {
        title: "CodeForge Next.js",
        description: "Next.js live preview",
        template: "nextjs",
        files: { ...defaults, ...userFiles },
      },
      openFile,
    };
  };

  const runFrameworkInStackblitz = async (runtimeLanguage: string) => {
    let built;
    if (runtimeLanguage === "react") built = buildReactProject();
    else if (runtimeLanguage === "vue") built = buildVueProject();
    else if (runtimeLanguage === "svelte") built = buildSvelteProject();
    else if (runtimeLanguage === "angular") built = buildAngularProject();
    else if (runtimeLanguage === "nextjs") built = buildNextProject();
    else return;

    addLog("info", `RUN: ${runtimeLanguage.toUpperCase()} StackBlitzda ishga tushirilmoqda...`);
    await openStackblitzProject(built.project, built.openFile);
    addLog("result", "OK: StackBlitz yangi oynada ochildi!");
  };

  const runCodeInBrowser = async (runtimeLanguage: string) => {
    try {
      if (frameworkLanguages.includes(runtimeLanguage)) {
        await runFrameworkInStackblitz(runtimeLanguage);
        return;
      }

      if (runtimeLanguage === "html") {
        const { css, js } = findLinkedFiles();
        const scssFiles = css.filter((f) => {
          const ext = f.name.split(".").pop()?.toLowerCase();
          return ext === "scss" || ext === "sass";
        });
        const cssFiles = css.filter((f) => !scssFiles.includes(f));

        addLog("info", "NOTE: HTML brauzerda ishga tushirilmoqda...");
        if (css.length > 0) {
          addLog("info", `NOTE: Bog'langan CSS/Sass fayllar: ${css.map(f => f.name).join(", ")}`);
        }
        if (js.length > 0) {
          addLog("info", `INFO: Bog'langan JS fayllar: ${js.map(f => f.name).join(", ")}`);
        }

        const newWindow = window.open("", "_blank");
        if (newWindow) {
          let htmlContent = code;

          if (cssFiles.length > 0) {
            const cssContent = cssFiles.map(f => f.content).join("\n");
            const styleTag = `<style>\n/* Auto-injected CSS */\n${cssContent}\n</style>`;

            if (htmlContent.includes("</head>")) {
              htmlContent = htmlContent.replace("</head>", `${styleTag}\n</head>`);
            } else if (htmlContent.includes("<body")) {
              htmlContent = htmlContent.replace("<body", `${styleTag}\n<body`);
            } else {
              htmlContent = styleTag + htmlContent;
            }
          }

          if (scssFiles.length > 0) {
            const scssContent = scssFiles.map(f => f.content).join("\n");
            const scssScript = `
<script src="https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.js"></script>
<script>
  (function() {
    var scss = ${JSON.stringify(scssContent)};
    try {
      var sass = new window.Sass();
      sass.compile(scss, function(result) {
        if (result && result.text) {
          var style = document.createElement("style");
          style.textContent = result.text;
          document.head.appendChild(style);
        } else if (result && result.formatted) {
          console.error(result.formatted);
        }
      });
    } catch (e) {
      console.error(e);
    }
  })();
</script>`;
            if (htmlContent.includes("</head>")) {
              htmlContent = htmlContent.replace("</head>", `${scssScript}\n</head>`);
            } else {
              htmlContent = scssScript + htmlContent;
            }
          }

          if (js.length > 0) {
            const jsContent = js.map(f => f.content).join("\n");
            const scriptTag = `<script>\n/* Auto-injected JavaScript */\n${jsContent}\n</script>`;

            if (htmlContent.includes("</body>")) {
              htmlContent = htmlContent.replace("</body>", `${scriptTag}\n</body>`);
            } else {
              htmlContent += scriptTag;
            }
          }

          newWindow.document.write(htmlContent);
          newWindow.document.close();
          addLog("result", "OK: HTML yangi oynada ochildi (CSS/JS/Sass bog'landi)!");
        }
        return;
      }

      if (runtimeLanguage === "css" || runtimeLanguage === "scss" || runtimeLanguage === "sass") {
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          const isSass = runtimeLanguage === "scss" || runtimeLanguage === "sass";
          const sassScript = isSass
            ? `
<script src="https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.js"></script>
<script>
  (function() {
    var scss = ${JSON.stringify(code)};
    var sass = new window.Sass();
    sass.compile(scss, function(result) {
      var css = (result && result.text) ? result.text : "";
      var style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    });
  })();
</script>`
            : "";

          const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CSS/Sass Preview</title>
    <style>${!isSass ? code : ""}</style>
    ${sassScript}
  </head>
  <body>
    <div class="demo">
      <h1>CSS/Sass Preview</h1>
      <p>Ushbu sahifa siz yozgan stil bilan bezatiladi.</p>
      <button class="btn">Button</button>
    </div>
  </body>
</html>`;

          newWindow.document.write(html);
          newWindow.document.close();
          addLog("result", "OK: CSS/Sass preview yangi oynada ochildi!");
        }
        return;
      }

      if (runtimeLanguage === "sql") {
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SQL Runner</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #0b0b0f; color: #f5f5f5; padding: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #2a2a2a; padding: 6px 8px; text-align: left; }
      th { background: #111827; }
      pre { white-space: pre-wrap; background: #111827; padding: 12px; border-radius: 8px; }
    </style>
  </head>
  <body>
    <h1>SQL Runner</h1>
    <pre id="sql"></pre>
    <div id="output"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js"></script>
    <script>
      const sqlText = ${JSON.stringify(code)};
      document.getElementById("sql").textContent = sqlText;
      initSqlJs({ locateFile: file => "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/" + file })
        .then(SQL => {
          const db = new SQL.Database();
          try {
            const results = db.exec(sqlText);
            const output = document.getElementById("output");
            if (!results.length) {
              output.innerHTML = "<p>Natija yo'q.</p>";
              return;
            }
            results.forEach((res, idx) => {
              const table = document.createElement("table");
              const thead = document.createElement("thead");
              const tr = document.createElement("tr");
              res.columns.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col;
                tr.appendChild(th);
              });
              thead.appendChild(tr);
              table.appendChild(thead);
              const tbody = document.createElement("tbody");
              res.values.forEach(row => {
                const r = document.createElement("tr");
                row.forEach(cell => {
                  const td = document.createElement("td");
                  td.textContent = String(cell);
                  r.appendChild(td);
                });
                tbody.appendChild(r);
              });
              table.appendChild(tbody);
              const title = document.createElement("h3");
              title.textContent = "Result " + (idx + 1);
              output.appendChild(title);
              output.appendChild(table);
            });
          } catch (e) {
            document.getElementById("output").innerHTML = "<p style='color:#f87171'>Xatolik: " + e.message + "</p>";
          }
        });
    </script>
  </body>
</html>`;
          newWindow.document.write(html);
          newWindow.document.close();
          addLog("result", "OK: SQL runner yangi oynada ochildi!");
        }
        return;
      }

      const customConsole = {
        log: (...args: any[]) => addLog("log", args.map(formatValue).join(" ")),
        error: (...args: any[]) => addLog("error", args.map(formatValue).join(" ")),
        warn: (...args: any[]) => addLog("warn", args.map(formatValue).join(" ")),
        info: (...args: any[]) => addLog("info", args.map(formatValue).join(" ")),
      };

      const sandboxCode = `(function(console) { "use strict"; ${code} })`;

      try {
        const fn = eval(sandboxCode);
        const result = fn(customConsole);
        if (result !== undefined) {
          addLog("result", `RESULT: ${formatValue(result)}`);
        }
        addLog("info", "OK: Kod muvaffaqiyatli bajarildi!");
      } catch (err: any) {
        addLog("error", `ERROR: Xatolik: ${err.message}`);
      }
    } catch (err: any) {
      addLog("error", `ERROR: Xatolik: ${err.message}`);
    }
  };

  const runCodeOnServer = async (runtimeLanguage: string, stdin: string = "") => {
    try {
      const serverLanguage = runtimeLanguage === "nodejs" ? "javascript" : runtimeLanguage;
      addLog("info", `RUN: ${runtimeLanguage.toUpperCase()} kodi serverda ishga tushirilmoqda...`);
      if (stdin) {
        addLog("info", `INPUT: ${stdin.split('\n').join(', ')}`);
      }

      // Supabase Edge Function orqali ishga tushirish
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code, language: serverLanguage, stdin },
      });

      // Agar Edge Function ishlamasa yoki deploy qilinmagan bo'lsa, to'g'ridan-to'g'ri Piston API ga murojaat qilamiz
      if (error || (data && !data.success)) {
        console.warn("Edge Function failed, falling back to Piston API direct call", error);

        // Language mapping for Piston
        const languageMap: Record<string, { language: string; version: string }> = {
          javascript: { language: "javascript", version: "18.15.0" },
          typescript: { language: "typescript", version: "5.0.3" },
          python: { language: "python", version: "3.10.0" },
          cpp: { language: "c++", version: "10.2.0" },
          c: { language: "c", version: "10.2.0" },
          java: { language: "java", version: "15.0.2" },
          go: { language: "go", version: "1.16.2" },
          rust: { language: "rust", version: "1.68.2" },
          php: { language: "php", version: "8.2.3" },
          ruby: { language: "ruby", version: "3.0.1" },
          csharp: { language: "csharp", version: "6.12.0" },
          nodejs: { language: "javascript", version: "18.15.0" },
        };

        // File name mapping for Piston (Critical for compiled languages like C++)
        const fileNameMap: Record<string, string> = {
          javascript: "index.js",
          typescript: "index.ts",
          python: "main.py",
          cpp: "main.cpp",
          c: "main.c",
          java: "Main.java",
          go: "main.go",
          rust: "main.rs",
          php: "index.php",
          ruby: "main.rb",
          csharp: "Program.cs",
          nodejs: "index.js",
        };

        const langConfig = languageMap[runtimeLanguage];
        if (!langConfig) {
          addLog("error", `ERROR: Kechirasiz, ${runtimeLanguage} tili uchun bevosita yurgizish imkoni yo'q.`);
          return;
        }

        // Silent fallback - no user visible warning
        console.warn("Using Piston API fallback due to server error");

        try {
          addLog("info", "WAIT: Kod ishga tushirilmoqda...");
          const response = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language: langConfig.language,
              version: langConfig.version,
              files: [{
                name: fileNameMap[runtimeLanguage] || "main.txt",
                content: code
              }],
              stdin: stdin || "",
            }),
          });

          if (!response.ok) {
            throw new Error("Piston API error: " + response.statusText);
          }

          const result = await response.json();

          // Show run output
          if (result.run) {
            if (result.run.stdout) addLog("result", result.run.stdout);
            if (result.run.stderr) addLog("error", result.run.stderr);
            if (result.run.code === 0) {
              addLog("info", `OK: Dastur muvaffaqiyatli bajarildi! (Fallback: ${result.language})`);
            } else {
              addLog("warn", `WARN: Dastur ${result.run.code} kodi bilan tugadi`);
            }
          }
          return; // Fallback success
        } catch (fallbackError: any) {
          addLog("error", `ERROR: Kodni ishga tushirib bo'lmadi: ${fallbackError.message}`);
          return;
        }
      }

      // Agar Edge Function ishlagan bo'lsa
      if (data.compile) {
        if (data.compile.stderr) {
          addLog("compile", `COMPILE: Kompilyatsiya xatosi:\n${data.compile.stderr}`);
        }
        if (data.compile.stdout) {
          addLog("compile", `COMPILE: Kompilyatsiya:\n${data.compile.stdout}`);
        }
      }

      if (data.run) {
        if (data.run.stdout) {
          addLog("result", data.run.stdout);
        }
        if (data.run.stderr) {
          addLog("error", data.run.stderr);
        }
        if (data.run.code === 0) {
          addLog("info", `OK: Dastur muvaffaqiyatli bajarildi! (${data.language} ${data.version})`);
        } else if (data.run.code !== undefined) {
          addLog("warn", `WARN: Dastur ${data.run.code} kodi bilan tugadi`);
        }
      }
    } catch (err: any) {
      addLog("error", `ERROR: Xatolik: ${err.message}`);
    }
  };

  const handleRunClick = () => {
    // Check if code needs input
    const runtimeLanguage = getRuntimeLanguage();
    if (inputLanguages.includes(runtimeLanguage) && codeNeedsInput(runtimeLanguage)) {
      setShowInputDialog(true);
    } else {
      runCode("");
    }
  };

  const handleRunWithInput = () => {
    setShowInputDialog(false);
    runCode(stdinInput);
    setStdinInput("");
  };

  const runCode = async (stdin: string) => {
    setIsRunning(true);
    clearLogs();
    const runtimeLanguage = getRuntimeLanguage();
    addLog("info", `RUN: ${runtimeLanguage.toUpperCase()} kodi ishga tushirilmoqda...`);

    try {
      if (browserLanguages.includes(runtimeLanguage)) {
        await runCodeInBrowser(runtimeLanguage);
      } else if (backendLanguages.includes(runtimeLanguage)) {
        await runCodeOnServer(runtimeLanguage, stdin);
      } else {
        addLog("error", `ERROR: ${runtimeLanguage.toUpperCase()} tili hozircha qo'llab-quvvatlanmaydi.`);
        addLog("info", `INFO: Qo'llab-quvvatlanadigan tillar: ${backendLanguages.join(", ")}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      case "result":
        return "text-green-400";
      case "compile":
        return "text-purple-400";
      default:
        return "text-foreground";
    }
  };

  const runtimeLanguage = getRuntimeLanguage();

  return (
    <>
      <div className="border-t-2 border-primary/30">
        {/* Terminal Header - Always visible with Run button */}
        <div
          className="flex items-center justify-between px-4 py-2 bg-cyber-dark cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <TerminalIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-jetbrains text-foreground tracking-wider">{t.terminal.title}</span>
            {logs.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-mono">
                {logs.length}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-inter px-2 py-0.5 rounded bg-muted/50">
              {runtimeLanguage.toUpperCase()}
            </span>
            {/* Linked files indicator */}
            {files && activeFile && runtimeLanguage === "html" && (
              <span className="text-xs text-accent font-inter">
                Linked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Input hint for languages that need it */}
            {inputLanguages.includes(runtimeLanguage) && codeNeedsInput(runtimeLanguage) && (
              <span className="text-xs text-accent flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                Input kerak
              </span>
            )}
            <MangaButton
              variant="accent"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRunClick();
              }}
              disabled={isRunning || !code.trim()}
              className="h-8 px-5 font-jetbrains"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? t.terminal.running : t.terminal.run}
            </MangaButton>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Terminal Content - Enhanced */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 280 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="h-[280px] flex flex-col bg-[#0a0a0a]">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/80" />
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--tokyo-yellow))]/80" />
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--tokyo-green))]/80" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      output
                    </span>
                    {/* Tabs */}
                    <div className="flex gap-1 ml-4">
                      <span className="px-3 py-1 text-xs rounded bg-muted/50 text-foreground font-mono border-b-2 border-primary">
                        Console
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearLogs();
                      }}
                      className="p-1.5 rounded hover:bg-muted/50 transition-colors group"
                      title={t.terminal.clear}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Logs */}
                <div className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8">
                      <TerminalIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="font-inter text-base mb-1">{t.terminal.ready}</p>
                      <p className="text-primary font-jetbrains text-sm">
                        {t.terminal.ready_desc}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs opacity-60">
                        <span className="px-2 py-1 rounded bg-muted/30">JavaScript</span>
                        <span className="px-2 py-1 rounded bg-muted/30">TypeScript</span>
                        <span className="px-2 py-1 rounded bg-muted/30">React</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Vue</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Svelte</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Angular</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Next.js</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Node.js</span>
                        <span className="px-2 py-1 rounded bg-muted/30">PHP</span>
                        <span className="px-2 py-1 rounded bg-muted/30">SQL</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Sass</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Python</span>
                        <span className="px-2 py-1 rounded bg-muted/30">C++</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Java</span>
                        <span className="px-2 py-1 rounded bg-muted/30">HTML+CSS</span>
                      </div>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn("flex gap-2 py-0.5", getLogColor(log.type))}
                      >
                        <span className="text-muted-foreground/40 text-xs w-16 flex-shrink-0 tabular-nums">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <pre className="whitespace-pre-wrap break-all flex-1 leading-relaxed">
                          {log.content}
                        </pre>
                      </motion.div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>

                {/* Interactive Input Line */}
                <div className="border-t border-border/30 p-2 bg-card/30">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">$</span>
                    <input
                      type="text"
                      placeholder="Buyruq yozing yoki Enter bosib kodni ishga tushiring..."
                      className="flex-1 bg-transparent text-foreground font-mono text-sm outline-none placeholder:text-muted-foreground/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = e.currentTarget.value.trim();
                          if (value === 'run' || value === '') {
                            handleRunClick();
                          } else if (value === 'clear' || value === 'cls') {
                            clearLogs();
                          } else if (value.startsWith('echo ')) {
                            addLog('log', value.substring(5));
                          } else {
                            addLog('info', `> ${value}`);
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Dialog */}
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="bg-cyber-dark border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              {t.terminal.input_title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-rajdhani">
              {t.terminal.input_desc}
            </p>
            <Textarea
              placeholder="Masalan:&#10;5&#10;10&#10;hello"
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              className="min-h-[120px] font-mono bg-background border-border"
              autoFocus
            />
            <div className="text-xs text-muted-foreground">
              Note: Har bir <code>cin &gt;&gt;</code> yoki <code>input()</code> uchun alohida qator yozing
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInputDialog(false);
                runCode("");
              }}
              className="font-rajdhani"
            >
              {t.terminal.run_without_input}
            </Button>
            <Button
              onClick={handleRunWithInput}
              className="bg-primary text-primary-foreground font-orbitron"
            >
              <Play className="h-4 w-4 mr-2" />
              {t.terminal.run_button}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Terminal;
