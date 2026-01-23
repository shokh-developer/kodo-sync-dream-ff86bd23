import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, Terminal as TerminalIcon, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { MangaButton } from "./MangaButton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  code: string;
  language: string;
}

interface LogEntry {
  type: "log" | "error" | "warn" | "info" | "result" | "compile";
  content: string;
  timestamp: Date;
}

// Languages that can run in browser
const browserLanguages = ["javascript", "html"];

// Languages supported by backend
const backendLanguages = ["javascript", "typescript", "python", "cpp", "c", "java", "go", "rust", "php", "ruby", "csharp"];

const Terminal = ({ isOpen, onToggle, code, language }: TerminalProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const addLog = (type: LogEntry["type"], content: string) => {
    setLogs((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  const runCodeInBrowser = () => {
    try {
      if (language === "html") {
        addLog("info", "HTML brauzerda preview qilish kerak. Alohida oyna ochiladi.");
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(code);
          newWindow.document.close();
          addLog("result", "✅ HTML yangi oynada ochildi!");
        }
        return;
      }

      // JavaScript
      const originalConsole = { ...console };
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

      Object.assign(console, originalConsole);
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
    }
  };

  const runCodeOnServer = async () => {
    try {
      addLog("info", `🚀 ${language.toUpperCase()} kodi serverda ishga tushirilmoqda...`);

      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code, language },
      });

      if (error) {
        addLog("error", `❌ Server xatosi: ${error.message}`);
        return;
      }

      if (!data.success) {
        addLog("error", `❌ Xatolik: ${data.error}`);
        return;
      }

      // Show compile output if exists
      if (data.compile) {
        if (data.compile.stderr) {
          addLog("compile", `⚙️ Kompilyatsiya xatosi:\n${data.compile.stderr}`);
        }
        if (data.compile.stdout) {
          addLog("compile", `⚙️ Kompilyatsiya:\n${data.compile.stdout}`);
        }
      }

      // Show run output
      if (data.run) {
        if (data.run.stdout) {
          addLog("result", data.run.stdout);
        }
        if (data.run.stderr) {
          addLog("error", data.run.stderr);
        }
        if (data.run.code === 0) {
          addLog("info", `✅ Dastur muvaffaqiyatli bajarildi! (${data.language} ${data.version})`);
        } else if (data.run.code !== undefined) {
          addLog("warn", `⚠️ Dastur ${data.run.code} kodi bilan tugadi`);
        }
      }
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    clearLogs();
    addLog("info", `▶ ${language.toUpperCase()} kodi ishga tushirilmoqda...`);

    try {
      if (browserLanguages.includes(language)) {
        runCodeInBrowser();
      } else if (backendLanguages.includes(language)) {
        await runCodeOnServer();
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

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return "❌";
      case "warn":
        return "⚠️";
      case "info":
        return "ℹ️";
      case "result":
        return "→";
      case "compile":
        return "⚙️";
      default:
        return "›";
    }
  };

  return (
    <div className="border-t-2 border-primary/30">
      {/* Terminal Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-cyber-dark cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-orbitron text-foreground tracking-wider">TERMINAL</span>
          {logs.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-mono">
              {logs.length}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-rajdhani px-2 py-0.5 rounded bg-muted/50">
            {language.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MangaButton
            variant="accent"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              runCode();
            }}
            disabled={isRunning || !code.trim()}
            className="h-7 px-4 font-orbitron"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isRunning ? "Ishlamoqda..." : "RUN"}
          </MangaButton>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 220 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="h-[220px] flex flex-col bg-[#0d0d0d]">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-cyber-dark">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-2">
                    output
                  </span>
                </div>
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

              {/* Logs */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    <TerminalIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-rajdhani text-base">Kodni ishga tushirish uchun</p>
                    <p className="text-primary font-orbitron mt-1">"RUN" tugmasini bosing</p>
                    <p className="text-xs mt-3 opacity-60">
                      C++, Python, JavaScript, TypeScript, Java, Go, Rust...
                    </p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("flex gap-2 py-0.5", getLogColor(log.type))}
                    >
                      <span className="text-muted-foreground/50 text-xs w-16 flex-shrink-0">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Terminal;
