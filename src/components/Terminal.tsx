import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, Terminal as TerminalIcon, X, ChevronUp, ChevronDown } from "lucide-react";
import { MangaButton } from "./MangaButton";
import { cn } from "@/lib/utils";

interface TerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  code: string;
  language: string;
}

interface LogEntry {
  type: "log" | "error" | "warn" | "info" | "result";
  content: string;
  timestamp: Date;
}

const Terminal = ({ isOpen, onToggle, code, language }: TerminalProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const addLog = (type: LogEntry["type"], content: string) => {
    setLogs((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  const runCode = () => {
    if (!["javascript", "typescript", "html"].includes(language)) {
      addLog("error", `❌ ${language.toUpperCase()} tilini brauzerda ishga tushirib bo'lmaydi. Faqat JavaScript, TypeScript va HTML ishlaydi.`);
      return;
    }

    setIsRunning(true);
    clearLogs();
    addLog("info", "▶ Kod ishga tushirilmoqda...");

    try {
      if (language === "html") {
        // Run HTML in iframe
        const iframe = iframeRef.current;
        if (iframe) {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(code);
            doc.close();
            addLog("result", "✅ HTML muvaffaqiyatli yuklandi!");
          }
        }
      } else {
        // Run JavaScript/TypeScript
        // Create a sandboxed environment
        const originalConsole = { ...console };
        
        // Override console methods
        const customConsole = {
          log: (...args: any[]) => addLog("log", args.map(a => formatValue(a)).join(" ")),
          error: (...args: any[]) => addLog("error", args.map(a => formatValue(a)).join(" ")),
          warn: (...args: any[]) => addLog("warn", args.map(a => formatValue(a)).join(" ")),
          info: (...args: any[]) => addLog("info", args.map(a => formatValue(a)).join(" ")),
        };

        // Create sandbox function
        const sandboxCode = `
          (function(console) {
            "use strict";
            ${code}
          })
        `;

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

        // Restore console
        Object.assign(console, originalConsole);
      }
    } catch (err: any) {
      addLog("error", `❌ Xatolik: ${err.message}`);
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
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="border-t border-border">
      {/* Terminal Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-cyber-dark cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-orbitron text-foreground">TERMINAL</span>
          {logs.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <MangaButton
            variant="accent"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              runCode();
            }}
            disabled={isRunning}
            className="h-7 px-3"
          >
            <Play className="h-3.5 w-3.5" />
            {isRunning ? "Ishlamoqda..." : "Run"}
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
            animate={{ height: 200 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="h-[200px] flex flex-col bg-cyber-dark">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
                <span className="text-xs text-muted-foreground font-rajdhani">
                  Console Output
                </span>
                <button
                  onClick={clearLogs}
                  className="p-1 rounded hover:bg-muted/50 transition-colors"
                  title="Tozalash"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>

              {/* Logs */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    <TerminalIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Kodni ishga tushirish uchun "Run" tugmasini bosing</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("flex gap-2", getLogColor(log.type))}
                    >
                      <span className="text-muted-foreground text-xs opacity-50">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <pre className="whitespace-pre-wrap break-all flex-1">
                        {log.content}
                      </pre>
                    </motion.div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>

              {/* Hidden iframe for HTML execution */}
              {language === "html" && (
                <iframe
                  ref={iframeRef}
                  className="hidden"
                  sandbox="allow-scripts"
                  title="HTML Preview"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Terminal;
