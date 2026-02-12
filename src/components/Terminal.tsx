import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, Terminal as TerminalIcon, ChevronUp, ChevronDown, Loader2, Keyboard, Eye, Code2 } from "lucide-react";
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
  files?: FileItem[];
  activeFile?: FileItem | null;
}

interface LogEntry {
  type: "log" | "error" | "warn" | "info" | "result" | "compile";
  content: string;
  timestamp: Date;
}

// Web languages that render in preview
const webLanguages = ["html", "css", "javascript", "jsx", "tsx", "typescript"];
const browserRenderLanguages = ["html", "css", "javascript", "jsx", "tsx"];

// Languages supported by backend
const backendLanguages = ["javascript", "typescript", "python", "cpp", "c", "java", "go", "rust", "php", "ruby", "csharp", "swift", "kotlin", "dart", "lua", "perl", "r", "scala", "bash", "sql"];

// Languages that typically need input
const inputLanguages = ["cpp", "c", "python", "java", "go", "rust", "csharp", "kotlin", "dart", "swift"];

const getLanguageFromExt = (ext: string): string => {
  const map: Record<string, string> = {
    js: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
    html: "html", css: "css", py: "python", cpp: "cpp", c: "c",
    java: "java", go: "go", rs: "rust", php: "php", rb: "ruby",
    cs: "csharp", swift: "swift", kt: "kotlin", dart: "dart",
    lua: "lua", pl: "perl", r: "r", scala: "scala", sh: "bash", sql: "sql",
  };
  return map[ext] || "plaintext";
};

const Terminal = ({ isOpen, onToggle, code, language, files, activeFile }: TerminalProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [stdinInput, setStdinInput] = useState("");
  const [activeTab, setActiveTab] = useState<"console" | "preview">("console");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const addLog = (type: LogEntry["type"], content: string) => {
    setLogs((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  const codeNeedsInput = () => {
    if (language === "cpp" || language === "c") return /\b(cin|scanf|gets|getline|getchar)\b/.test(code);
    if (language === "python") return /\binput\s*\(/.test(code);
    if (language === "java") return /\bScanner\b/.test(code);
    return false;
  };

  // Gather all web files from the project for combined preview
  const gatherWebFiles = () => {
    if (!files) return { htmlFiles: [], cssFiles: [], jsFiles: [], tsxFiles: [] };
    
    const currentPath = activeFile?.path || "/";
    const htmlFiles: FileItem[] = [];
    const cssFiles: FileItem[] = [];
    const jsFiles: FileItem[] = [];
    const tsxFiles: FileItem[] = [];

    files.forEach(file => {
      if (file.is_folder) return;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'html') htmlFiles.push(file);
      else if (ext === 'css' || ext === 'scss') cssFiles.push(file);
      else if (ext === 'js') jsFiles.push(file);
      else if (ext === 'jsx' || ext === 'tsx' || ext === 'ts') tsxFiles.push(file);
    });

    // Sort: same path files first
    const sortByPath = (a: FileItem, b: FileItem) => {
      if (a.path === currentPath && b.path !== currentPath) return -1;
      if (b.path === currentPath && a.path !== currentPath) return 1;
      return 0;
    };

    return {
      htmlFiles: htmlFiles.sort(sortByPath),
      cssFiles: cssFiles.sort(sortByPath),
      jsFiles: jsFiles.sort(sortByPath),
      tsxFiles: tsxFiles.sort(sortByPath),
    };
  };

  // Build a full HTML page combining all web files
  const buildWebPreview = (): string => {
    const { htmlFiles, cssFiles, jsFiles, tsxFiles } = gatherWebFiles();
    
    const allCss = cssFiles.map(f => f.content).join('\n');
    const allJs = jsFiles.map(f => f.content).join('\n');
    const hasTsx = tsxFiles.length > 0 || language === 'tsx' || language === 'jsx';
    const allTsx = tsxFiles.map(f => f.content).join('\n');
    
    // Collect ALL code for library detection
    const allCode = [code, allCss, allJs, allTsx, ...htmlFiles.map(f => f.content)].join('\n');
    
    let mainHtml = '';
    if (language === 'html') {
      mainHtml = code;
    } else {
      const htmlFile = htmlFiles.find(f => f.path === (activeFile?.path || '/')) || htmlFiles[0];
      mainHtml = htmlFile?.content || '';
    }

    if (mainHtml) {
      let result = mainHtml;
      
      if (allCss) {
        const cssTag = `<style>\n${allCss}\n</style>`;
        if (result.includes('</head>')) result = result.replace('</head>', `${cssTag}\n</head>`);
        else if (result.includes('<body')) result = result.replace('<body', `${cssTag}\n<body`);
        else result = cssTag + '\n' + result;
      }
      
      if (language === 'css') {
        const currentCssTag = `<style>\n${code}\n</style>`;
        if (result.includes('</head>')) result = result.replace('</head>', `${currentCssTag}\n</head>`);
        else result = currentCssTag + '\n' + result;
      }
      
      const jsCode = language === 'javascript' ? code + '\n' + allJs : allJs;
      if (jsCode.trim()) {
        const jsTag = `<script>\ntry {\n${jsCode}\n} catch(e) { console.error(e); }\n<\/script>`;
        if (result.includes('</body>')) result = result.replace('</body>', `${jsTag}\n</body>`);
        else result += '\n' + jsTag;
      }

      if (hasTsx) {
        const tsxCode = (language === 'tsx' || language === 'jsx') ? code : allTsx;
        if (tsxCode.trim()) result = injectReactSupport(result, tsxCode);
      }

      return wrapWithDarkBg(result, allCode);
    }

    // No HTML file — generate based on language
    if (language === 'css') {
      return wrapWithDarkBg(`<!DOCTYPE html><html><head><style>${allCss}\n${code}</style></head>
<body><div style="padding:20px"><h1>CSS Preview</h1><p>HTML fayl yarating yoki elementlar qo'shing.</p>
<div class="box" style="width:100px;height:100px;background:#7c3aed;border-radius:8px;margin:16px 0"></div>
<button style="padding:8px 16px;border-radius:4px;border:none;background:#7c3aed;color:white;cursor:pointer">Button</button>
</div></body></html>`, allCode);
    }

    if (language === 'javascript') {
      return wrapWithDarkBg(`<!DOCTYPE html><html><head><style>${allCss}</style></head><body>
<div id="app"></div><div id="root"></div><div id="output"></div>
<script>
const _output = document.getElementById('output');
const _origLog = console.log;
console.log = function(...args) {
  _origLog.apply(console, args);
  const p = document.createElement('pre');
  p.style.cssText = 'color:#a9dc76;margin:2px 0;font-family:monospace;';
  p.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a,null,2) : String(a)).join(' ');
  _output.appendChild(p);
};
console.error = function(...args) {
  const p = document.createElement('pre');
  p.style.cssText = 'color:#ff6188;margin:2px 0;font-family:monospace;';
  p.textContent = args.map(a => String(a)).join(' ');
  _output.appendChild(p);
};
try { ${code} } catch(e) { console.error(e.message); }
<\/script></body></html>`, allCode);
    }

    if (language === 'tsx' || language === 'jsx') {
      return wrapWithDarkBg(buildTsxPreview(code, allCss), allCode);
    }

    return '';
  };

  const buildTsxPreview = (tsxCode: string, css: string): string => {
    // Simple TSX/JSX transpilation: strip type annotations and convert JSX
    return `<!DOCTYPE html>
<html><head>
<style>${css}</style>
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
</head><body>
<div id="root"></div>
<script type="text/babel" data-presets="react,typescript">
${tsxCode}

// Auto-render: find the default export or last component
try {
  const _rootEl = document.getElementById('root');
  const _root = ReactDOM.createRoot(_rootEl);
  
  // Try to find App or default component
  if (typeof App !== 'undefined') {
    _root.render(React.createElement(App));
  } else if (typeof Main !== 'undefined') {
    _root.render(React.createElement(Main));
  } else if (typeof Home !== 'undefined') {
    _root.render(React.createElement(Home));
  } else if (typeof Component !== 'undefined') {
    _root.render(React.createElement(Component));
  } else if (typeof Page !== 'undefined') {
    _root.render(React.createElement(Page));
  }
} catch(e) {
  document.getElementById('root').innerHTML = '<pre style="color:#ff6188">' + e.message + '</pre>';
}
</script></body></html>`;
  };

  const injectReactSupport = (html: string, tsxCode: string): string => {
    const reactScripts = `
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>`;

    const tsxTag = `<script type="text/babel" data-presets="react,typescript">
${tsxCode}
try {
  const _rootEl = document.getElementById('root') || document.getElementById('app');
  if (_rootEl) {
    const _root = ReactDOM.createRoot(_rootEl);
    if (typeof App !== 'undefined') _root.render(React.createElement(App));
    else if (typeof Main !== 'undefined') _root.render(React.createElement(Main));
    else if (typeof Component !== 'undefined') _root.render(React.createElement(Component));
  }
} catch(e) { console.error(e); }
</script>`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${reactScripts}\n</head>`);
    } else {
      html = reactScripts + '\n' + html;
    }

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${tsxTag}\n</body>`);
    } else {
      html += '\n' + tsxTag;
    }

    return html;
  };

  // Detect which libraries the code actually uses
  const detectUsedLibraries = (allCode: string): string => {
    const libs: string[] = [];
    
    // Fonts - always light
    libs.push('<link rel="preconnect" href="https://fonts.googleapis.com">');
    libs.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
    libs.push('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet">');
    
    // Only load libraries that are actually referenced in code
    if (/fa-|font-awesome|fas |fab |far /i.test(allCode))
      libs.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">');
    
    if (/class=".*\b(container|row|col-|btn |btn-|navbar|modal|card |carousel)/i.test(allCode) || /bootstrap/i.test(allCode)) {
      libs.push('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">');
      libs.push('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"><\/script>');
    }
    
    if (/class=".*\b(flex |grid |bg-|text-|p-|m-|w-|h-|rounded|shadow|border)/i.test(allCode) || /tailwind/i.test(allCode))
      libs.push('<script src="https://cdn.tailwindcss.com"><\/script>');
    
    if (/animate__/i.test(allCode))
      libs.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">');
    
    if (/\bAOS\b|data-aos/i.test(allCode)) {
      libs.push('<link href="https://unpkg.com/aos@2.3.4/dist/aos.css" rel="stylesheet">');
      libs.push('<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"><\/script>');
    }
    
    if (/\$\(|jQuery/i.test(allCode))
      libs.push('<script src="https://code.jquery.com/jquery-3.7.1.min.js"><\/script>');
    
    if (/\bgsap\b|TweenMax|TimelineMax|ScrollTrigger/i.test(allCode)) {
      libs.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>');
      libs.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"><\/script>');
    }
    
    if (/\banime\b\(/i.test(allCode))
      libs.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"><\/script>');
    
    if (/THREE\.|three\.js/i.test(allCode))
      libs.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"><\/script>');
    
    if (/\bChart\b|new Chart/i.test(allCode))
      libs.push('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>');
    
    if (/\b_\.\w+|lodash/i.test(allCode))
      libs.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"><\/script>');
    
    if (/\baxios\b/i.test(allCode))
      libs.push('<script src="https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js"><\/script>');
    
    if (/\bSwal\b|sweetalert/i.test(allCode))
      libs.push('<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"><\/script>');
    
    if (/\bTyped\b/i.test(allCode))
      libs.push('<script src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"><\/script>');
    
    if (/particlesJS|particles\.js/i.test(allCode))
      libs.push('<script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"><\/script>');
    
    if (/\bSwiper\b/i.test(allCode)) {
      libs.push('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">');
      libs.push('<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"><\/script>');
    }
    
    if (/ScrollReveal/i.test(allCode))
      libs.push('<script src="https://unpkg.com/scrollreveal@4.0.9/dist/scrollreveal.min.js"><\/script>');
    
    if (/\bVue\b|createApp|v-if|v-for/i.test(allCode))
      libs.push('<script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>');
    
    if (/x-data|x-show|x-bind|Alpine/i.test(allCode))
      libs.push('<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"><\/script>');
    
    return libs.join('\n');
  };

  const wrapWithDarkBg = (html: string, allCode?: string): string => {
    const darkStyle = `<style>
html, body { 
  background: #1a1a2e !important; 
  color: #e0e0e0 !important; 
  margin: 0; padding: 8px; 
  font-family: 'Inter', system-ui, sans-serif;
}
* { box-sizing: border-box; }
</style>`;
    
    const libs = detectUsedLibraries(allCode || html);
    const headContent = darkStyle + '\n' + libs;
    
    if (html.includes('<head>')) {
      return html.replace('<head>', `<head>\n${headContent}`);
    } else if (html.includes('<!DOCTYPE')) {
      return html.replace(/(<html[^>]*>)/, `$1<head>${headContent}</head>`);
    }
    return `<!DOCTYPE html><html><head>${headContent}</head><body>${html}</body></html>`;
  };

  // Run web preview in iframe
  const runWebPreview = () => {
    const html = buildWebPreview();
    if (!html) {
      addLog("error", "Preview yaratib bo'lmadi. HTML fayl yarating.");
      return;
    }

    const { cssFiles, jsFiles, tsxFiles } = gatherWebFiles();
    
    addLog("info", "🌐 Web preview ishga tushirilmoqda...");
    if (cssFiles.length > 0) addLog("info", `🎨 CSS: ${cssFiles.map(f => f.name).join(', ')}`);
    if (jsFiles.length > 0) addLog("info", `⚡ JS: ${jsFiles.map(f => f.name).join(', ')}`);
    if (tsxFiles.length > 0) addLog("info", `⚛️ TSX/JSX: ${tsxFiles.map(f => f.name).join(', ')}`);
    
    setPreviewHtml(html);
    setActiveTab("preview");
    addLog("result", "✅ Preview tayyor! Preview tabini ko'ring.");
  };

  const runCodeInBrowser = () => {
    try {
      if (browserRenderLanguages.includes(language)) {
        runWebPreview();
        return;
      }

      // Plain JavaScript console execution
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
        if (result !== undefined) addLog("result", `↳ ${formatValue(result)}`);
        addLog("info", "✅ Kod muvaffaqiyatli bajarildi!");
      } catch (err: any) {
        addLog("error", `❌ Xatolik: ${err.message}`);
      }
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
    }
  };

  const runCodeOnServer = async (stdin: string = "") => {
    try {
      addLog("info", `🚀 ${language.toUpperCase()} kodi serverda ishga tushirilmoqda...`);
      if (stdin) addLog("info", `📥 Input: ${stdin.split('\n').join(', ')}`);

      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code, language: language === 'tsx' ? 'typescript' : language, stdin },
      });

      if (error) { addLog("error", `❌ Server xatosi: ${error.message}`); return; }
      handleServerResult(data);
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
    }
  };

  const runCommandOnServer = async (lang: string, codeToRun: string, stdin: string = "") => {
    try {
      setIsRunning(true);
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code: codeToRun, language: lang, stdin },
      });
      if (error) { addLog("error", `❌ Server xatosi: ${error.message}`); return; }
      handleServerResult(data);
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleServerResult = (data: any) => {
    if (!data.success) { addLog("error", `❌ Xatolik: ${data.error}`); return; }
    if (data.compile) {
      if (data.compile.stderr) addLog("compile", `⚙️ Kompilyatsiya xatosi:\n${data.compile.stderr}`);
      if (data.compile.stdout) addLog("compile", `⚙️ Kompilyatsiya:\n${data.compile.stdout}`);
    }
    if (data.run) {
      if (data.run.stdout) addLog("result", data.run.stdout);
      if (data.run.stderr) addLog("error", data.run.stderr);
      if (data.run.code === 0) addLog("info", `✅ Muvaffaqiyatli! (${data.language} ${data.version})`);
      else if (data.run.code !== undefined) addLog("warn", `⚠️ Dastur ${data.run.code} kodi bilan tugadi`);
    }
  };

  const handleRunClick = () => {
    if (inputLanguages.includes(language) && codeNeedsInput()) {
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
    addLog("info", `▶ ${language.toUpperCase()} kodi ishga tushirilmoqda...`);

    try {
      if (browserRenderLanguages.includes(language)) {
        runCodeInBrowser();
      } else if (backendLanguages.includes(language)) {
        await runCodeOnServer(stdin);
      } else {
        addLog("error", `❌ ${language.toUpperCase()} tili qo'llab-quvvatlanmaydi.`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") { try { return JSON.stringify(value, null, 2); } catch { return String(value); } }
    return String(value);
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "error": return "text-red-400";
      case "warn": return "text-yellow-400";
      case "info": return "text-blue-400";
      case "result": return "text-green-400";
      case "compile": return "text-purple-400";
      default: return "text-foreground";
    }
  };

  const isWebFile = browserRenderLanguages.includes(language);

  return (
    <>
      <div className="border-t-2 border-primary/30">
        {/* Terminal Header */}
        <div
          className="flex items-center justify-between px-4 py-2 bg-cyber-dark cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <TerminalIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-jetbrains text-foreground tracking-wider">TERMINAL</span>
            {logs.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-mono">
                {logs.length}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-inter px-2 py-0.5 rounded bg-muted/50">
              {language.toUpperCase()}
            </span>
            {isWebFile && (
              <span className="text-xs text-accent font-inter flex items-center gap-1">
                <Eye className="h-3 w-3" /> Web Preview
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {inputLanguages.includes(language) && codeNeedsInput() && (
              <span className="text-xs text-accent flex items-center gap-1">
                <Keyboard className="h-3 w-3" /> Input kerak
              </span>
            )}
            <MangaButton
              variant="accent"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleRunClick(); }}
              disabled={isRunning || !code.trim()}
              className="h-8 px-5 font-jetbrains"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? "Running..." : "RUN"}
            </MangaButton>
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Terminal Content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 300 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="h-[300px] flex flex-col bg-[#0a0a0a]">
                {/* Toolbar with tabs */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/80" />
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--tokyo-yellow))]/80" />
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--tokyo-green))]/80" />
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 ml-4">
                      <button
                        onClick={() => setActiveTab("console")}
                        className={cn(
                          "px-3 py-1 text-xs rounded font-mono transition-colors",
                          activeTab === "console"
                            ? "bg-muted/50 text-foreground border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Code2 className="h-3 w-3 inline mr-1" />
                        Console
                      </button>
                      <button
                        onClick={() => setActiveTab("preview")}
                        className={cn(
                          "px-3 py-1 text-xs rounded font-mono transition-colors",
                          activeTab === "preview"
                            ? "bg-muted/50 text-foreground border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Eye className="h-3 w-3 inline mr-1" />
                        Preview
                        {previewHtml && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeTab === "console") clearLogs();
                        else setPreviewHtml("");
                      }}
                      className="p-1.5 rounded hover:bg-muted/50 transition-colors group"
                      title="Tozalash"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Console tab */}
                {activeTab === "console" && (
                  <>
                    <div className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1">
                      {logs.length === 0 ? (
                        <div className="text-muted-foreground text-center py-8">
                          <TerminalIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="font-inter text-base mb-1">Terminal tayyor</p>
                          <p className="text-primary font-jetbrains text-sm">
                            "RUN" bosing yoki buyruq yozing
                          </p>
                          <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs opacity-60">
                            <span className="px-2 py-1 rounded bg-muted/30">HTML+CSS+JS</span>
                            <span className="px-2 py-1 rounded bg-muted/30">TSX/JSX</span>
                            <span className="px-2 py-1 rounded bg-muted/30">Python</span>
                            <span className="px-2 py-1 rounded bg-muted/30">C++</span>
                            <span className="px-2 py-1 rounded bg-muted/30">Java</span>
                            <span className="px-2 py-1 rounded bg-muted/30">Go</span>
                            <span className="px-2 py-1 rounded bg-muted/30">Rust</span>
                            <span className="px-2 py-1 rounded bg-muted/30">Swift</span>
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

                    {/* Command input */}
                    <div className="border-t border-border/30 p-2 bg-card/30">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-mono text-sm">$</span>
                        <input
                          type="text"
                          placeholder="run, help, node file.js, python main.py..."
                          className="flex-1 bg-transparent text-foreground font-mono text-sm outline-none placeholder:text-muted-foreground/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value.trim();
                              if (!value) return;
                              e.currentTarget.value = '';
                              addLog('info', `$ ${value}`);
                              
                              if (value === 'run') {
                                handleRunClick();
                              } else if (value === 'clear' || value === 'cls') {
                                clearLogs();
                              } else if (value === 'help') {
                                addLog('info', '📋 Mavjud buyruqlar:');
                                addLog('log', '  run              - Joriy faylni ishga tushirish');
                                addLog('log', '  clear / cls      - Terminalni tozalash');
                                addLog('log', '  echo <matn>      - Matnni chop etish');
                                addLog('log', '  node <fayl/kod>  - JavaScript ishga tushirish');
                                addLog('log', '  python <fayl/kod>- Python ishga tushirish');
                                addLog('log', '  g++ <fayl>       - C++ kompilyatsiya va run');
                                addLog('log', '  java <fayl>      - Java ishga tushirish');
                                addLog('log', '  go run <fayl>    - Go ishga tushirish');
                                addLog('log', '  exec <til> <kod> - Istalgan tilda kod');
                                addLog('log', '  ls / cat <fayl>  - Fayllarni ko\'rish');
                              } else if (value.startsWith('echo ')) {
                                addLog('log', value.substring(5));
                              } else if (value === 'ls' || value === 'dir') {
                                if (files && files.length > 0) {
                                  addLog('log', files.map(f => `${f.is_folder ? '📁' : '📄'} ${f.path}${f.name}`).join('\n'));
                                } else {
                                  addLog('info', 'Fayllar mavjud emas');
                                }
                              } else if (value.startsWith('cat ')) {
                                const fileName = value.substring(4).trim();
                                const file = files?.find(f => f.name === fileName || (f.path + f.name) === fileName);
                                if (file && !file.is_folder) addLog('log', file.content || '(bo\'sh fayl)');
                                else addLog('error', `Fayl topilmadi: ${fileName}`);
                              } else if (value === 'date') {
                                addLog('log', new Date().toLocaleString());
                              } else if (value === 'whoami') {
                                addLog('log', 'CodeForge foydalanuvchisi');
                              } else if (value.startsWith('exec ')) {
                                const parts = value.substring(5).trim();
                                const spaceIdx = parts.indexOf(' ');
                                if (spaceIdx > 0) {
                                  runCommandOnServer(parts.substring(0, spaceIdx).trim(), parts.substring(spaceIdx + 1).trim());
                                } else {
                                  addLog('error', 'Format: exec <til> <kod>');
                                }
                              } else if (value.startsWith('node ')) {
                                const arg = value.substring(5).trim();
                                const file = files?.find(f => f.name === arg);
                                runCommandOnServer('javascript', file ? file.content : arg);
                              } else if (value.startsWith('python ') || value.startsWith('python3 ')) {
                                const arg = value.replace(/^python3?\s+/, '').trim();
                                const file = files?.find(f => f.name === arg);
                                runCommandOnServer('python', file ? file.content : arg);
                              } else if (value.startsWith('g++ ') || value.startsWith('gcc ')) {
                                const cppFile = value.split(' ').pop()?.trim();
                                const file = files?.find(f => f.name === cppFile);
                                if (file) runCommandOnServer(value.startsWith('g++') ? 'cpp' : 'c', file.content);
                                else addLog('error', `Fayl topilmadi: ${cppFile}`);
                              } else if (value.startsWith('java ') || value.startsWith('javac ')) {
                                const jFile = value.split(' ').pop()?.trim();
                                const file = files?.find(f => f.name === jFile);
                                if (file) runCommandOnServer('java', file.content);
                                else addLog('error', `Fayl topilmadi: ${jFile}`);
                              } else if (value.startsWith('go run ')) {
                                const goFile = value.substring(7).trim();
                                const file = files?.find(f => f.name === goFile);
                                if (file) runCommandOnServer('go', file.content);
                                else addLog('error', `Fayl topilmadi: ${goFile}`);
                              } else if (value.startsWith('swift ')) {
                                const arg = value.substring(6).trim();
                                const file = files?.find(f => f.name === arg);
                                runCommandOnServer('swift', file ? file.content : arg);
                              } else if (/^(ruby|php|lua|bash|sh|perl|kotlin|dart|rust|scala|r)\s/.test(value)) {
                                const cmdParts = value.split(' ');
                                let cmdLang = cmdParts[0] === 'sh' ? 'bash' : cmdParts[0];
                                const cmdArg = cmdParts.slice(1).join(' ').trim();
                                const file = files?.find(f => f.name === cmdArg);
                                runCommandOnServer(cmdLang, file ? file.content : cmdArg);
                              } else if (value.startsWith('npm ') || value.startsWith('yarn ') || value.startsWith('npx ')) {
                                addLog('warn', '⚠️ npm/yarn/npx qo\'llab-quvvatlanmaydi. "node <fayl>" ishlating.');
                              } else {
                                addLog('warn', `Noma'lum buyruq: ${value}. "help" yozing.`);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Preview tab */}
                {activeTab === "preview" && (
                  <div className="flex-1 overflow-hidden bg-[#1a1a2e]">
                    {previewHtml ? (
                      <iframe
                        ref={iframeRef}
                        srcDoc={previewHtml}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                        title="Web Preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Eye className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p className="font-inter text-base mb-1">Preview bo'sh</p>
                          <p className="text-sm text-primary">
                            HTML, CSS, JS yoki TSX faylini "RUN" qiling
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              Dastur uchun input kiriting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-rajdhani">
              Har bir qiymatni yangi qatorga yozing.
            </p>
            <Textarea
              placeholder="Masalan:&#10;5&#10;10&#10;hello"
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              className="min-h-[120px] font-mono bg-background border-border"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowInputDialog(false); runCode(""); }} className="font-rajdhani">
              Inputsiz ishga tushirish
            </Button>
            <Button onClick={handleRunWithInput} className="bg-primary text-primary-foreground font-orbitron">
              <Play className="h-4 w-4 mr-2" />
              Ishga tushirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Terminal;
