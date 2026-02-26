import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MangaButton } from "./MangaButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Loader2,
  Code,
  Lightbulb,
  Bug,
  Zap,
  FilePlus,
  Wand2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: AIAction[];
}

interface AIAction {
  type: "create_file" | "create_folder" | "edit_code" | "apply_code" | "update_file";
  name?: string;
  path?: string;
  language?: string;
  content?: string;
  description?: string;
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  is_folder: boolean;
}

interface AIAssistantProps {
  code: string;
  language: string;
  files: FileItem[];
  activeFile: FileItem | null;
  onCreateFile: (name: string, path: string, isFolder: boolean, language?: string, content?: string) => Promise<any>;
  onUpdateFileContent: (fileId: string, content: string) => void;
  author?: string;
}



const AIAssistant = ({
  code,
  language,
  files,
  activeFile,
  onCreateFile,
  onUpdateFileContent,
  author = "Shokh-Developer",
}: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [aiDisabled, setAiDisabled] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const quickPrompts = [
    { icon: Code, label: t.ai.prompts.explain, prompt: t.ai.prompts.explain },
    { icon: Bug, label: t.ai.prompts.fix, prompt: t.ai.prompts.fix },
    { icon: Lightbulb, label: t.ai.prompts.optimize, prompt: t.ai.prompts.optimize },
    { icon: Zap, label: t.ai.prompts.feature, prompt: t.ai.prompts.feature },
    { icon: FilePlus, label: t.ai.prompts.create, prompt: t.ai.prompts.create },
    { icon: Wand2, label: t.ai.prompts.refactor, prompt: t.ai.prompts.refactor },
  ];

  useEffect(() => {
    const checkSettings = async () => {
      // Check if current user has AI access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: aiAccess } = await supabase
          .from("user_ai_access")
          .select("ai_enabled")
          .eq("user_id", user.id)
          .single();

        if (aiAccess) {
          setAiDisabled(!aiAccess.ai_enabled);
        }
      }
    };
    checkSettings();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseAIResponse = (content: string): { text: string; actions: AIAction[] } => {
    let actions: AIAction[] = [];
    let text = content;


    // Better approach: Regex for "Command + CodeBlock" pattern
    // [UPDATE_FILE: src/App.tsx]
    // ```tsx ... ```

    // Let's rely on the AI putting the path in the command, and the NEXT code block belonging to it.

    const pendingCommands: { type: "create" | "update"; path: string; name?: string; language?: string }[] = [];
    let textParts = text.split(/(```[\s\S]*?```)/g);

    actions = []; // Reset actions to rebuild them with code context

    textParts.forEach(part => {
      if (part.startsWith('```')) {
        // It's a code block
        const match = /```(\w+)?\n([\s\S]*?)```/.exec(part);
        if (match) {
          const code = match[2].trim();
          const lang = match[1] || language;

          const command = pendingCommands.shift();
          if (command) {
            if (command.type === "create") {
              const path = command.path.endsWith("/") ? command.path : `${command.path}/`;
              actions.push({
                type: "create_file",
                name: command.name,
                path,
                language: command.language || lang,
                content: code,
                description: `Create: ${path}${command.name}`,
              });
            } else if (command.type === "update") {
              actions.push({
                type: "update_file",
                path: command.path,
                content: code,
                language: lang,
                description: `${t.ai.prompts.refactor}: ${command.path}`,
              });
            }
          } else {
            // unexpected code block, maybe apply to active?
            actions.push({
              type: "apply_code",
              content: code,
              language: lang,
              description: t.editor.sync
            });
          }
        }
      } else {
        // It's text, look for commands
        const createMatch = /\[CREATE_FILE:\s*([^\],]+),\s*([^\],]+),\s*([^\]]+)\]/g;
        let m;
        while ((m = createMatch.exec(part)) !== null) {
          const fileName = m[1].trim();
          const rawPath = m[2].trim();
          const filePath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
          const fileLang = m[3].trim();
          const path = filePath.endsWith("/") ? filePath : `${filePath}/`;
          actions.push({
            type: "create_file",
            name: fileName,
            path,
            language: fileLang,
            content: "",
            description: `Create: ${path}${fileName}`,
          });
          pendingCommands.push({ type: "create", path: filePath, name: fileName, language: fileLang });
        }

        const updateMatch = /\[UPDATE_FILE:\s*([^\],]+)\]/g;
        while ((m = updateMatch.exec(part)) !== null) {
          const fullPath = m[1].trim();
          pendingCommands.push({ type: "update", path: fullPath });
        }

        const folderMatch = /\[CREATE_FOLDER:\s*([^\],]+),\s*([^\]]+)\]/g;
        while ((m = folderMatch.exec(part)) !== null) {
          actions.push({
            type: "create_folder",
            name: m[1].trim(),
            path: m[2].trim(),
          });
        }
      }
    });

    while (pendingCommands.length > 0) {
      const command = pendingCommands.shift();
      if (command?.type === "create" && command.name && command.path) {
        const path = command.path.endsWith("/") ? command.path : `${command.path}/`;
        actions.push({
          type: "create_file",
          name: command.name,
          path,
          language: command.language || language,
          content: "",
          description: `Create: ${path}${command.name}`,
        });
      }
    }

    text = text.replace(/\[CREATE_FILE:.*?\]/g, "").replace(/\[UPDATE_FILE:.*?\]/g, "").replace(/\[CREATE_FOLDER:.*?\]/g, "");

    return { text: text.trim(), actions };
  };

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    // Check if AI is disabled for this user
    if (aiDisabled) {
      toast({
        title: "AI o'chirilgan",
        description: "Admin tomonidan sizning AI dan foydalanish huquqingiz o'chirilgan",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build context about current project (Full context)
      const fileList = files
        .filter(f => !f.is_folder && f.language !== 'plaintext') // Filter for code files
        .map(f => `
--- ${f.path}${f.name} ---
\`\`\`${f.language}
${f.content}
\`\`\`
`).join("\n");

      const enhancedPrompt = `
Foydalanuvchi so'rovi: ${prompt}

PROYEKT KONTEKSTI (Barcha fayllar):
${fileList}

JORIY FAYL: ${activeFile?.name || "Yo'q"}
\`\`\`${language}
${code || "// Hali kod yo'q"}
\`\`\`

Qoidalar:
1. Sen butun loyihani ko'ra olasan. Agar biror faylga o'zgartirish kerak bo'lsa, aniq fayl nomini ayt.
2. Yangi fayl yaratish: [CREATE_FILE: fayl_nomi, path, language]
3. Yangi papka yaratish: [CREATE_FOLDER: papka_nomi, path]
4. Kod optimizatsiyasi yoki xatolarni to'g'irlashda boshqa fayllarga ham e'tibor ber (importlar, funksiyalar).
5. Savol bermasdan, aniq o'zgartirishlar taklif qil va kerak bo'lsa faylni yangila.
`;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { prompt: enhancedPrompt, code, language },
      });

      if (error) throw error;

      const responseText = data.response || "Javob olishda xatolik yuz berdi";
      const { text, actions } = parseAIResponse(responseText);

      const assistantMessage: Message = {
        role: "assistant",
        content: text,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (actions.length > 0) {
        await applyActions(actions);
      }
    } catch (error) {
      console.error("AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: AIAction, silent: boolean = false) => {
    try {
      switch (action.type) {
        case "create_file":
          if (action.name && action.path) {
            const withSlash = action.path.startsWith("/") ? action.path : `/${action.path}`;
            const normalizedPath = withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
            const fullPath = `${normalizedPath}${action.name}`;
            const existing = files.find(
              (f) => (f.path + f.name) === fullPath || f.name === action.name
            );

            if (existing) {
              if (action.content && existing.content !== action.content) {
                onUpdateFileContent(existing.id, action.content);
              }
            } else {
              const created = await onCreateFile(action.name, normalizedPath, false, action.language, action.content || "");
              if (!created) {
                const msg = `Fayl yaratilmadi: ${fullPath}`;
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: msg, timestamp: new Date() },
                ]);
                if (!silent) {
                  toast({ title: "Xatolik", description: msg, variant: "destructive" });
                }
              }
            }
            if (!silent) {
              toast({
                title: "Fayl yaratildi!",
                description: `${action.name} muvaffaqiyatli yaratildi`,
              });
            }
          }
          break;
        case "create_folder":
          if (action.name && action.path) {
            await onCreateFile(action.name, action.path, true);
            if (!silent) {
              toast({
                title: "Papka yaratildi!",
                description: `${action.name} papkasi muvaffaqiyatli yaratildi`,
              });
            }
          }
          break;
        case "update_file":
          if (action.path && action.content) {
            // Find file by path
            const normalized = action.path.startsWith("/") ? action.path : `/${action.path}`;
            const targetFile = files.find(
              (f) => (f.path + f.name) === normalized || f.name === normalized.split("/").pop()
            );

            if (targetFile) {
              onUpdateFileContent(targetFile.id, action.content);
              if (!silent) {
                toast({
                  title: "Fayl yangilandi",
                  description: `${targetFile.name} muvaffaqiyatli o'zgartirildi`,
                });
              }
            } else {
              const msg = `Fayl topilmadi: ${action.path}`;
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: msg, timestamp: new Date() },
              ]);
              if (!silent) {
                toast({
                  title: "Xatolik",
                  description: msg,
                  variant: "destructive",
                });
              }
            }
          }
          break;
        case "apply_code":
          if (action.content && activeFile) {
            onUpdateFileContent(activeFile.id, action.content);
            if (!silent) {
              toast({
                title: "Kod qo'llanildi!",
                description: "Kod muvaffaqiyatli yangilandi",
              });
            }
          } else if (!activeFile) {
            if (!silent) {
              toast({
                title: "Xatolik",
                description: "Avval biror faylni tanlang",
                variant: "destructive",
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error("Action error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xatolik: AI amaliyotini bajarib bo'lmadi. Iltimos konsolni tekshiring.",
          timestamp: new Date(),
        },
      ]);
      if (!silent) {
        toast({
          title: "Xatolik",
          description: "Amaliyotni bajarishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    }
  };

  const applyActions = async (actions: AIAction[]) => {
    const seen = new Set<string>();
    for (const action of actions) {
      if (action.type === "create_file" && action.name && action.path) {
        const normalizedPath = action.path.endsWith("/") ? action.path : `${action.path}/`;
        const key = `${normalizedPath}${action.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      await handleAction(action, true);
    }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
  };

  // If AI is disabled, don't render anything
  if (aiDisabled) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <motion.div
        className="fixed bottom-4 right-[132px] z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-12 w-12 rounded-xl shadow-lg transition-all duration-200",
            "flex items-center justify-center backdrop-blur-sm",
            isOpen
              ? "bg-primary/20 text-primary border border-primary/50"
              : "bg-card/90 text-primary border border-border hover:border-primary/50 hover:bg-card"
          )}
          title={`Developed by ${author}`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed z-50 bg-card border border-border rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden flex flex-col ${isExpanded
              ? "bottom-4 right-4 left-4 top-4 md:bottom-10 md:right-10 md:left-auto md:top-10 md:w-[700px]"
              : "bottom-20 right-4 md:right-20 w-[95vw] md:w-[500px] max-h-[80vh]"
              }`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary/20 to-transparent border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-orbitron font-bold flex items-center gap-2">
                      CodeForge AI
                      <span className="inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold bg-secondary text-secondary-foreground">
                        {t.ai.badge}
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t.ai.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    title={isExpanded ? "Kichiklashtirish" : "Kattalashtirish"}
                  >
                    {isExpanded ? (
                      <Minimize2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    title="Chatni tozalash"
                  >
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    title="Yopish"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className={`flex-1 p-4 ${isExpanded ? "h-full" : "h-[400px]"}`} ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Wand2 className="h-12 w-12 mx-auto text-primary/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t.ai.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.ai.subtitle}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickPrompts.map((item, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => sendMessage(item.prompt)}
                        className="flex items-center gap-2 p-3 rounded-lg bg-background/50 hover:bg-background/80 border border-border transition-colors text-left"
                      >
                        <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-xs">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback
                          className={
                            msg.role === "user"
                              ? "bg-primary/20 text-primary"
                              : "bg-accent/20 text-accent"
                          }
                        >
                          {msg.role === "user" ? "U" : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div
                          className={`p-3 rounded-xl text-sm ${msg.role === "user"
                            ? "bg-primary/20 text-foreground"
                            : "bg-background/50 border border-border"
                            }`}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown
                                components={{
                                  code({ className, children, ...props }) {
                                    const isCodeBlock = className?.includes("language-");
                                    if (isCodeBlock) {
                                      const codeString = String(children).replace(/\n$/, "");
                                      return (
                                        <div className="relative group">
                                          <pre className="bg-background/80 p-3 rounded-lg overflow-x-auto text-xs">
                                            <code {...props}>{children}</code>
                                          </pre>
                                          <button
                                            onClick={() => copyCode(codeString, index)}
                                            className="absolute top-2 right-2 p-1.5 rounded bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            {copiedIndex === index ? (
                                              <Check className="h-3 w-3 text-green-400" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                          </button>
                                        </div>
                                      );
                                    }
                                    return (
                                      <code
                                        className="bg-background/80 px-1.5 py-0.5 rounded text-xs font-mono"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                  pre({ children }) {
                                    return <>{children}</>;
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>

                        {msg.actions && msg.actions.length > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            O'zgartirishlar avtomatik qo'llandi.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/20 text-accent">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 p-3 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.ai.analyzing}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.ai.placeholder}
                  className="flex-1 bg-background/50"
                  disabled={isLoading}
                />
                <MangaButton
                  type="submit"
                  variant="primary"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </MangaButton>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                "index.html yaratib ber" yoki "bu kodni optimizatsiya qil" deb yozing
              </p>
            </form>

            {/* Footer */}
            <div className="text-xs text-muted-foreground text-center p-2 border-t border-border">
              Developed by {author}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
