import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MangaButton } from "./MangaButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Maximize2, Minimize2 } from "lucide-react";
// Badge import removed - using span instead
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
  FileCode,
  FolderPlus,
  FilePlus,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  ArrowUp,
  Crown,
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
  type: "create_file" | "create_folder" | "edit_code" | "apply_code";
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

const quickPrompts = [
  { icon: Code, label: "Kodni tushuntir", prompt: "Bu kodni tushuntirib ber" },
  { icon: Bug, label: "Xatoni top", prompt: "Bu kodda xato bormi? Tekshirib ber" },
  { icon: Lightbulb, label: "Optimizatsiya", prompt: "Bu kodni qanday yaxshilash mumkin?" },
  { icon: Zap, label: "Yangi funksiya", prompt: "Bu kodga yangi funksiya qo'sh" },
  { icon: FilePlus, label: "Yangi fayl yarat", prompt: "Menga yangi fayl yaratib ber" },
  { icon: Wand2, label: "Kodni o'zgartir", prompt: "Ushbu kodni o'zgartir" },
];

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
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [aiDisabled, setAiDisabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkSettings = async () => {
      // Check if AI upgrade is enabled
      const { data: upgradeSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "ai_upgrade_enabled")
        .single();
      
      if (upgradeSetting?.value) {
        setShowUpgrade((upgradeSetting.value as any).enabled || false);
      }

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
    const actions: AIAction[] = [];
    let text = content;

    // Parse file creation commands: [CREATE_FILE: name.ext, path, language]
    const createFileRegex = /\[CREATE_FILE:\s*([^\],]+),\s*([^\],]+),\s*([^\]]+)\]/g;
    let match;
    while ((match = createFileRegex.exec(content)) !== null) {
      actions.push({
        type: "create_file",
        name: match[1].trim(),
        path: match[2].trim(),
        language: match[3].trim(),
      });
    }
    text = text.replace(createFileRegex, "");

    // Parse folder creation: [CREATE_FOLDER: name, path]
    const createFolderRegex = /\[CREATE_FOLDER:\s*([^\],]+),\s*([^\]]+)\]/g;
    while ((match = createFolderRegex.exec(content)) !== null) {
      actions.push({
        type: "create_folder",
        name: match[1].trim(),
        path: match[2].trim(),
      });
    }
    text = text.replace(createFolderRegex, "");

    // Parse code blocks that should be applied
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks: { language: string; code: string }[] = [];
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || language,
        code: match[2].trim(),
      });
    }

    // If there's code block and context suggests it should be applied
    if (codeBlocks.length > 0) {
      codeBlocks.forEach((block, index) => {
        actions.push({
          type: "apply_code",
          content: block.code,
          language: block.language,
          description: `Kod blok #${index + 1}`,
        });
      });
    }

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
      // Build context about current project
      const fileList = files.map(f => `${f.is_folder ? "📁" : "📄"} ${f.path}${f.name}`).join("\n");
      const enhancedPrompt = `
Foydalanuvchi so'rovi: ${prompt}

Joriy loyiha konteksti:
- Faoliyatdagi fayl: ${activeFile?.name || "Yo'q"} (${activeFile?.language || "noma'lum"})
- Barcha fayllar:
${fileList}

Joriy kod:
\`\`\`${language}
${code || "// Hali kod yo'q"}
\`\`\`

Qoidalar:
1. Agar foydalanuvchi yangi fayl yaratishni so'rasa, javobingizda [CREATE_FILE: fayl_nomi, path, language] formatida ko'rsating
2. Agar foydalanuvchi yangi papka yaratishni so'rasa, javobingizda [CREATE_FOLDER: papka_nomi, path] formatida ko'rsating
3. Agar kod yozib bersangiz, uni \`\`\` ichida yozing va foydalanuvchi uni "Qo'llash" tugmasi orqali kodga kiritishi mumkin
4. HTML, CSS, JavaScript fayllarini birlashtirish haqida ham yordam bera olasiz
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

  const handleAction = async (action: AIAction) => {
    try {
      switch (action.type) {
        case "create_file":
          if (action.name && action.path) {
            await onCreateFile(action.name, action.path, false, action.language, "");
            toast({
              title: "Fayl yaratildi!",
              description: `${action.name} muvaffaqiyatli yaratildi`,
            });
          }
          break;
        case "create_folder":
          if (action.name && action.path) {
            await onCreateFile(action.name, action.path, true);
            toast({
              title: "Papka yaratildi!",
              description: `${action.name} papkasi muvaffaqiyatli yaratildi`,
            });
          }
          break;
        case "apply_code":
          if (action.content && activeFile) {
            onUpdateFileContent(activeFile.id, action.content);
            toast({
              title: "Kod qo'llanildi!",
              description: "Kod muvaffaqiyatli yangilandi",
            });
          } else if (!activeFile) {
            toast({
              title: "Xatolik",
              description: "Avval biror faylni tanlang",
              variant: "destructive",
            });
          }
          break;
      }
    } catch (error) {
      console.error("Action error:", error);
      toast({
        title: "Xatolik",
        description: "Amaliyotni bajarishda xatolik yuz berdi",
        variant: "destructive",
      });
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
        className="fixed bottom-4 right-[136px] z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <MangaButton
          variant="primary"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30"
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
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <Sparkles className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </MangaButton>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed z-50 bg-card border border-border rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden flex flex-col ${
              isExpanded 
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
                        Bepul
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Kod yozish, fayl yaratish, optimizatsiya
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
                      GitHub Copilot kabi kuchli AI yordamchi!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fayl yarating, kod yozing, optimizatsiya qiling
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
                          className={`p-3 rounded-xl text-sm ${
                            msg.role === "user"
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

                        {/* Action buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.actions.map((action, actionIndex) => (
                              <motion.button
                                key={actionIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-medium transition-colors"
                                onClick={() => handleAction(action)}
                              >
                                {action.type === "create_file" && (
                                  <>
                                    <FilePlus className="h-3.5 w-3.5 text-primary" />
                                    <span>{action.name} yaratish</span>
                                  </>
                                )}
                                {action.type === "create_folder" && (
                                  <>
                                    <FolderPlus className="h-3.5 w-3.5 text-primary" />
                                    <span>{action.name} papka</span>
                                  </>
                                )}
                                {action.type === "apply_code" && (
                                  <>
                                    <FileCode className="h-3.5 w-3.5 text-accent" />
                                    <span>Kodni qo'llash</span>
                                  </>
                                )}
                              </motion.button>
                            ))}
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
                          Kod tahlil qilinmoqda...
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
                  placeholder="Fayl yarat, kod yoz, xatoni top..."
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
                💡 "index.html yaratib ber" yoki "bu kodni optimizatsiya qil" deb yozing
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
