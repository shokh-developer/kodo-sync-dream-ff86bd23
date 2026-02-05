import Editor, { OnMount } from "@monaco-editor/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAICompletions } from "@/hooks/useAICompletions";
import { debounce } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MangaButton } from "./MangaButton";
import {
  Lightbulb,
  Bug,
  TestTube,
  FileText,
  Sparkles,
  Loader2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  is_folder: boolean;
}

interface CodeEditorWithAIProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  files?: FileItem[];
}

const CodeEditorWithAI = ({
  code,
  language,
  onChange,
  readOnly = false,
  files = [],
}: CodeEditorWithAIProps) => {
  const [mounted, setMounted] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiResultType, setAiResultType] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);
  const { toast } = useToast();

  const {
    isLoading,
    currentSuggestion,
    getInlineCompletion,
    explainCode,
    fixCode,
    generateTests,
    refactorCode,
    generateDocs,
    clearSuggestion,
  } = useAICompletions();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced inline completion
  const debouncedGetCompletion = useCallback(
    debounce(async (editor: any, monaco: any) => {
      if (readOnly) return;

      const model = editor.getModel();
      if (!model) return;

      const position = editor.getPosition();
      if (!position) return;

      const currentCode = model.getValue();
      const cursorPosition = {
        line: position.lineNumber,
        column: position.column,
      };

      // Inline completion ol
      const suggestion = await getInlineCompletion(
        currentCode,
        language,
        cursorPosition,
        files
      );

      if (suggestion) {
        // Ghost text ko'rsat
        showGhostText(editor, monaco, suggestion, position);
      }
    }, 800),
    [language, files, readOnly, getInlineCompletion]
  );

  // Ghost text ko'rsatish
  const showGhostText = (
    editor: any,
    monaco: any,
    suggestion: string,
    position: any
  ) => {
    // Avvalgi dekoratsiyalarni o'chir
    if (decorationsRef.current.length > 0) {
      editor.deltaDecorations(decorationsRef.current, []);
    }

    // Yangi ghost text qo'sh
    const newDecorations = editor.deltaDecorations(
      [],
      [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            after: {
              content: suggestion,
              inlineClassName: "ghost-text-suggestion",
            },
          },
        },
      ]
    );

    decorationsRef.current = newDecorations;
  };

  // Ghost textni qabul qilish (Tab)
  const acceptSuggestion = useCallback(() => {
    if (!currentSuggestion || !editorRef.current) return;

    const editor = editorRef.current;
    const position = editor.getPosition();

    if (position) {
      // Ghost textni qo'sh
      editor.executeEdits("ai-completion", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: currentSuggestion,
        },
      ]);

      // Cursorni oxiriga o'tqaz
      const newPosition = editor.getModel()?.getPositionAt(
        editor.getModel()?.getOffsetAt(position) + currentSuggestion.length
      );
      if (newPosition) {
        editor.setPosition(newPosition);
      }
    }

    // Ghost textni o'chir
    if (decorationsRef.current.length > 0) {
      editor.deltaDecorations(decorationsRef.current, []);
      decorationsRef.current = [];
    }
    clearSuggestion();
  }, [currentSuggestion, clearSuggestion]);

  // Ghost textni rad etish (Esc)
  const rejectSuggestion = useCallback(() => {
    if (!editorRef.current) return;

    if (decorationsRef.current.length > 0) {
      editorRef.current.deltaDecorations(decorationsRef.current, []);
      decorationsRef.current = [];
    }
    clearSuggestion();
  }, [clearSuggestion]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Tab tugmasini qo'lga ol
    editor.addCommand(monaco.KeyCode.Tab, () => {
      if (currentSuggestion) {
        acceptSuggestion();
      } else {
        // Default tab behavior
        editor.trigger("keyboard", "tab", {});
      }
    });

    // Escape tugmasini qo'lga ol
    editor.addCommand(monaco.KeyCode.Escape, () => {
      if (currentSuggestion) {
        rejectSuggestion();
      }
    });

    // Cursor o'zgarganda inline completion ol
    editor.onDidChangeCursorPosition(() => {
      debouncedGetCompletion(editor, monaco);
    });

    // Sichqoncha context menu
    editor.onContextMenu((e: any) => {
      setActionPosition({ x: e.event.posx, y: e.event.posy });
      setShowActions(true);
    });

    // Ghost text uchun CSS stil
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .ghost-text-suggestion {
        color: #6b7280 !important;
        font-style: italic;
        opacity: 0.6;
      }
    `;
    document.head.appendChild(styleElement);
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
      // Suggestion o'chir chunki kod o'zgardi
      rejectSuggestion();
    }
  };

  // Code actions
  const handleExplain = async () => {
    setShowActions(false);
    const result = await explainCode(code, language);
    if (result) {
      setAiResult(result);
      setAiResultType("explain");
    }
  };

  const handleFix = async () => {
    setShowActions(false);
    const result = await fixCode(code, language);
    if (result) {
      setAiResult(result);
      setAiResultType("fix");
    }
  };

  const handleTests = async () => {
    setShowActions(false);
    const result = await generateTests(code, language);
    if (result) {
      setAiResult(result);
      setAiResultType("tests");
    }
  };

  const handleRefactor = async () => {
    setShowActions(false);
    const result = await refactorCode(code, language);
    if (result) {
      setAiResult(result);
      setAiResultType("refactor");
    }
  };

  const handleDocs = async () => {
    setShowActions(false);
    const result = await generateDocs(code, language);
    if (result) {
      setAiResult(result);
      setAiResultType("docs");
    }
  };

  const applyAiResult = () => {
    if (aiResult && aiResultType !== "explain") {
      // Kod bloklarni ajratib ol
      const codeMatch = aiResult.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeMatch) {
        onChange(codeMatch[1].trim());
        toast({
          title: "Kod qo'llanildi",
          description: "AI tavsiyasi muvaffaqiyatli qo'llanildi",
        });
      }
    }
    setAiResult(null);
    setAiResultType(null);
  };

  const closeAiResult = () => {
    setAiResult(null);
    setAiResultType(null);
  };

  if (!mounted) {
    return (
      <div className="h-full w-full bg-cyber-dark flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Loading Editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Monaco Editor */}
      <div className="h-full w-full rounded-lg overflow-hidden border border-border">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            readOnly: readOnly,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            lineNumbers: "on",
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
        />
      </div>

      {/* AI Loading Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-primary/20 rounded-lg border border-primary/30"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-primary">AI tahlil qilmoqda...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion Accept/Reject Hint */}
      <AnimatePresence>
        {currentSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-2 bg-background/90 rounded-lg border border-border"
          >
            <span className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Tab</kbd> qabul qilish
            </span>
            <span className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Esc</kbd> bekor qilish
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu - Code Actions */}
      <AnimatePresence>
        {showActions && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowActions(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[200px]"
              style={{ left: actionPosition.x, top: actionPosition.y }}
            >
              <div className="text-xs text-muted-foreground px-2 py-1 border-b border-border mb-1">
                <Sparkles className="h-3 w-3 inline mr-1" />
                CodeForge AI Actions
              </div>
              <button
                onClick={handleExplain}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted/50 text-sm transition-colors"
              >
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Tushuntir
              </button>
              <button
                onClick={handleFix}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted/50 text-sm transition-colors"
              >
                <Bug className="h-4 w-4 text-red-500" />
                Xatoni to'g'irla
              </button>
              <button
                onClick={handleTests}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted/50 text-sm transition-colors"
              >
                <TestTube className="h-4 w-4 text-green-500" />
                Testlar yarat
              </button>
              <button
                onClick={handleRefactor}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted/50 text-sm transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-blue-500" />
                Refaktor qil
              </button>
              <button
                onClick={handleDocs}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted/50 text-sm transition-colors"
              >
                <FileText className="h-4 w-4 text-purple-500" />
                Dokumentatsiya
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Result Panel */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bottom-4 w-[400px] bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col z-30"
          >
            <div className="p-3 bg-primary/10 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  {aiResultType === "explain" && "Kod tushuntirmasi"}
                  {aiResultType === "fix" && "To'g'irlangan kod"}
                  {aiResultType === "tests" && "Yaratilgan testlar"}
                  {aiResultType === "refactor" && "Refaktor qilingan kod"}
                  {aiResultType === "docs" && "Dokumentatsiya"}
                </span>
              </div>
              <button
                onClick={closeAiResult}
                className="p-1 rounded hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">{aiResult}</pre>
            </div>
            {aiResultType !== "explain" && (
              <div className="p-3 border-t border-border flex gap-2">
                <MangaButton
                  variant="primary"
                  size="sm"
                  onClick={applyAiResult}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Qo'llash
                </MangaButton>
                <MangaButton
                  variant="secondary"
                  size="sm"
                  onClick={closeAiResult}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Bekor
                </MangaButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodeEditorWithAI;
