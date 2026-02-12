import { useState, useRef, useEffect } from "react";
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
const browserLanguages = ["javascript", "html", "css"];

// Languages supported by backend
const backendLanguages = ["javascript", "typescript", "python", "cpp", "c", "java", "go", "rust", "php", "ruby", "csharp", "swift", "kotlin", "dart", "lua", "perl", "r", "scala", "bash", "sql"];

// Languages that typically need input
const inputLanguages = ["cpp", "c", "python", "java", "go", "rust", "csharp", "kotlin", "dart", "swift"];

// File extensions to language mapping
const getLanguageFromExt = (ext: string): string => {
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    py: "python",
    cpp: "cpp",
    c: "c",
    java: "java",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    cs: "csharp",
    swift: "swift",
    kt: "kotlin",
    dart: "dart",
    lua: "lua",
    pl: "perl",
    r: "r",
    scala: "scala",
    sh: "bash",
    sql: "sql",
  };
  return map[ext] || "plaintext";
};

const Terminal = ({ isOpen, onToggle, code, language, files, activeFile }: TerminalProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
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

  // Check if code contains input functions
  const codeNeedsInput = () => {
    if (language === "cpp" || language === "c") {
      return /\b(cin|scanf|gets|getline|getchar)\b/.test(code);
    }
    if (language === "python") {
      return /\binput\s*\(/.test(code);
    }
    if (language === "java") {
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
      if (ext === 'css' || ext === 'scss') {
        linkedCss.push(file);
      } else if (ext === 'js' || ext === 'jsx') {
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

  const runCodeInBrowser = () => {
    try {
      if (language === "html") {
        const { css, js } = findLinkedFiles();
        
        addLog("info", "🌐 HTML brauzerda ishga tushirilmoqda...");
        if (css.length > 0) {
          addLog("info", `🎨 Bog'langan CSS fayllar: ${css.map(f => f.name).join(', ')}`);
        }
        if (js.length > 0) {
          addLog("info", `⚡ Bog'langan JS fayllar: ${js.map(f => f.name).join(', ')}`);
        }

        const newWindow = window.open("", "_blank");
        if (newWindow) {
          // Build HTML with linked CSS and JS
          let htmlContent = code;
          
          // Inject CSS into head
          if (css.length > 0) {
            const cssContent = css.map(f => f.content).join('\n');
            const styleTag = `<style>\n/* Auto-injected CSS */\n${cssContent}\n</style>`;
            
            if (htmlContent.includes('</head>')) {
              htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
            } else if (htmlContent.includes('<body')) {
              htmlContent = htmlContent.replace('<body', `${styleTag}\n<body`);
            } else {
              htmlContent = styleTag + htmlContent;
            }
          }
          
          // Inject JS before closing body
          if (js.length > 0) {
            const jsContent = js.map(f => f.content).join('\n');
            const scriptTag = `<script>\n/* Auto-injected JavaScript */\n${jsContent}\n</script>`;
            
            if (htmlContent.includes('</body>')) {
              htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
            } else {
              htmlContent += scriptTag;
            }
          }
          
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          addLog("result", "✅ HTML yangi oynada ochildi (CSS va JS bog'landi)!");
        }
        return;
      }

      if (language === "css") {
        addLog("warn", "⚠️ CSS faylni alohida ishga tushirib bo'lmaydi.");
        addLog("info", "💡 CSS ni HTML fayliga bog'lang yoki HTML faylini ishga tushiring.");
        return;
      }

      // JavaScript
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
          addLog("result", `↳ ${formatValue(result)}`);
        }
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
      if (stdin) {
        addLog("info", `📥 Input: ${stdin.split('\n').join(', ')}`);
      }

      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code, language, stdin },
      });

      if (error) {
        addLog("error", `❌ Server xatosi: ${error.message}`);
        return;
      }

      handleServerResult(data);
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
    }
  };

  // Terminal buyruqlaridan foydalanish uchun
  const runCommandOnServer = async (lang: string, codeToRun: string, stdin: string = "") => {
    try {
      setIsRunning(true);
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code: codeToRun, language: lang, stdin },
      });

      if (error) {
        addLog("error", `❌ Server xatosi: ${error.message}`);
        return;
      }

      handleServerResult(data);
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleServerResult = (data: any) => {
    if (!data.success) {
      addLog("error", `❌ Xatolik: ${data.error}`);
      return;
    }

    if (data.compile) {
      if (data.compile.stderr) {
        addLog("compile", `⚙️ Kompilyatsiya xatosi:\n${data.compile.stderr}`);
      }
      if (data.compile.stdout) {
        addLog("compile", `⚙️ Kompilyatsiya:\n${data.compile.stdout}`);
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
        addLog("info", `✅ Muvaffaqiyatli bajarildi! (${data.language} ${data.version})`);
      } else if (data.run.code !== undefined) {
        addLog("warn", `⚠️ Dastur ${data.run.code} kodi bilan tugadi`);
      }
    }
  };

  const handleRunClick = () => {
    // Check if code needs input
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
      if (browserLanguages.includes(language)) {
        runCodeInBrowser();
      } else if (backendLanguages.includes(language)) {
        await runCodeOnServer(stdin);
      } else {
        addLog("error", `❌ ${language.toUpperCase()} tili hozircha qo'llab-quvvatlanmaydi.`);
        addLog("info", `ℹ️ Qo'llab-quvvatlanadigan tillar: ${backendLanguages.join(", ")}`);
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
            <span className="text-sm font-jetbrains text-foreground tracking-wider">TERMINAL</span>
            {logs.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-mono">
                {logs.length}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-inter px-2 py-0.5 rounded bg-muted/50">
              {language.toUpperCase()}
            </span>
            {/* Linked files indicator */}
            {files && activeFile && language === 'html' && (
              <span className="text-xs text-accent font-inter">
                📦 Linked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Input hint for languages that need it */}
            {inputLanguages.includes(language) && codeNeedsInput() && (
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
              {isRunning ? "Running..." : "RUN"}
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
                      title="Tozalash"
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
                      <p className="font-inter text-base mb-1">Terminal tayyor</p>
                      <p className="text-primary font-jetbrains text-sm">
                        Kodni ishga tushirish uchun "RUN" bosing
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs opacity-60">
                        <span className="px-2 py-1 rounded bg-muted/30">JavaScript</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Python</span>
                        <span className="px-2 py-1 rounded bg-muted/30">C++</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Java</span>
                        <span className="px-2 py-1 rounded bg-muted/30">HTML+CSS</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Swift</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Kotlin</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Go</span>
                        <span className="px-2 py-1 rounded bg-muted/30">Rust</span>
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
                            addLog('log', '  swift <fayl/kod> - Swift ishga tushirish');
                            addLog('log', '  ruby/php/lua/bash/perl <fayl/kod>');
                            addLog('log', '  exec <til> <kod> - Istalgan tilda kod');
                            addLog('log', '  ls / dir         - Fayllar ro\'yxati');
                            addLog('log', '  cat <fayl>       - Fayl tarkibini ko\'rish');
                            addLog('log', '  date             - Sana');
                            addLog('log', '  whoami           - Foydalanuvchi');
                          } else if (value.startsWith('echo ')) {
                            addLog('log', value.substring(5));
                          } else if (value === 'ls' || value === 'dir') {
                            if (files && files.length > 0) {
                              const fileList = files.map(f => 
                                `${f.is_folder ? '📁' : '📄'} ${f.path}${f.name}`
                              ).join('\n');
                              addLog('log', fileList);
                            } else {
                              addLog('info', 'Fayllar mavjud emas');
                            }
                          } else if (value.startsWith('cat ')) {
                            const fileName = value.substring(4).trim();
                            const file = files?.find(f => f.name === fileName || (f.path + f.name) === fileName);
                            if (file && !file.is_folder) {
                              addLog('log', file.content || '(bo\'sh fayl)');
                            } else {
                              addLog('error', `Fayl topilmadi: ${fileName}`);
                            }
                          } else if (value === 'date') {
                            addLog('log', new Date().toLocaleString());
                          } else if (value === 'whoami') {
                            addLog('log', 'CodeForge foydalanuvchisi');
                          } else if (value.startsWith('exec ')) {
                            const parts = value.substring(5).trim();
                            const spaceIdx = parts.indexOf(' ');
                            if (spaceIdx > 0) {
                              const lang = parts.substring(0, spaceIdx).trim();
                              const execCode = parts.substring(spaceIdx + 1).trim();
                              runCommandOnServer(lang, execCode);
                            } else {
                              addLog('error', 'Format: exec <til> <kod>');
                            }
                          } else if (value.startsWith('node ')) {
                            const arg = value.substring(5).trim();
                            const file = files?.find(f => f.name === arg);
                            if (file) {
                              runCommandOnServer('javascript', file.content);
                            } else {
                              runCommandOnServer('javascript', arg);
                            }
                          } else if (value.startsWith('python ') || value.startsWith('python3 ')) {
                            const arg = value.replace(/^python3?\s+/, '').trim();
                            const file = files?.find(f => f.name === arg);
                            if (file) {
                              runCommandOnServer('python', file.content);
                            } else {
                              runCommandOnServer('python', arg);
                            }
                          } else if (value.startsWith('g++ ') || value.startsWith('gcc ')) {
                            const cppFile = value.split(' ').pop()?.trim();
                            const file = files?.find(f => f.name === cppFile);
                            if (file) {
                              runCommandOnServer(value.startsWith('g++') ? 'cpp' : 'c', file.content);
                            } else {
                              addLog('error', `Fayl topilmadi: ${cppFile}`);
                            }
                          } else if (value.startsWith('java ') || value.startsWith('javac ')) {
                            const jFile = value.split(' ').pop()?.trim();
                            const file = files?.find(f => f.name === jFile);
                            if (file) {
                              runCommandOnServer('java', file.content);
                            } else {
                              addLog('error', `Fayl topilmadi: ${jFile}`);
                            }
                          } else if (value.startsWith('go run ')) {
                            const goFile = value.substring(7).trim();
                            const file = files?.find(f => f.name === goFile);
                            if (file) {
                              runCommandOnServer('go', file.content);
                            } else {
                              addLog('error', `Fayl topilmadi: ${goFile}`);
                            }
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
                            addLog('warn', '⚠️ npm/yarn/npx serverda qo\'llab-quvvatlanmaydi.');
                            addLog('info', '💡 "node <fayl>" yoki "run" buyrug\'idan foydalaning.');
                          } else if (value.startsWith('pip ') || value.startsWith('pip3 ')) {
                            addLog('warn', '⚠️ pip serverda qo\'llab-quvvatlanmaydi.');
                            addLog('info', '💡 "python <fayl/kod>" buyrug\'idan foydalaning.');
                          } else {
                            addLog('warn', `Noma'lum buyruq: ${value}`);
                            addLog('info', '💡 "help" yozing buyruqlarni ko\'rish uchun');
                          }
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
              Dastur uchun input kiriting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-rajdhani">
              Sizning kodingizda <code className="text-accent">cin</code>, <code className="text-accent">input()</code> yoki boshqa kiritish funksiyalari bor. 
              Har bir qiymatni yangi qatorga yozing.
            </p>
            <Textarea
              placeholder="Masalan:&#10;5&#10;10&#10;hello"
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              className="min-h-[120px] font-mono bg-background border-border"
              autoFocus
            />
            <div className="text-xs text-muted-foreground">
              💡 Har bir <code>cin &gt;&gt;</code> yoki <code>input()</code> uchun alohida qator yozing
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
              Inputsiz ishga tushirish
            </Button>
            <Button
              onClick={handleRunWithInput}
              className="bg-primary text-primary-foreground font-orbitron"
            >
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
