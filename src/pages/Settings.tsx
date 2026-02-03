import { motion } from "framer-motion";
import { ArrowLeft, Palette, Check, Monitor, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MangaButton } from "@/components/MangaButton";
import { MangaCard } from "@/components/MangaCard";
import { useTheme, Theme } from "@/contexts/ThemeContext";

const themes: { id: Theme; name: string; description: string; colors: string[]; icon?: React.ElementType }[] = [
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "VS Code uslubidagi qorong'u ko'k-binafsha tema",
    colors: ["#1a1b26", "#7aa2f7", "#bb9af7", "#7dcfff"],
    icon: Moon,
  },
  {
    id: "shades-of-purple",
    name: "Shades of Purple",
    description: "Professional binafsha ranglar to'plami",
    colors: ["#1e1e3f", "#fad000", "#a599e9", "#ff628c"],
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    description: "GitHub ning klassik qorong'u temasi",
    colors: ["#0d1117", "#58a6ff", "#3fb950", "#f85149"],
    icon: Monitor,
  },
  {
    id: "monokai-pro",
    name: "Monokai Pro",
    description: "Mashhur Monokai ranglar sxemasi",
    colors: ["#2d2a2e", "#ffd866", "#ff6188", "#78dce8"],
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "Klassik Dracula qorong'u tema",
    colors: ["#282a36", "#ff79c6", "#bd93f9", "#50fa7b"],
  },
  {
    id: "one-dark-pro",
    name: "One Dark Pro",
    description: "Atom editorigining mashhur temasi",
    colors: ["#282c34", "#61afef", "#c678dd", "#98c379"],
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MangaButton
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </MangaButton>
          <div>
            <h1 className="text-3xl font-jetbrains font-bold text-gradient-tokyo">
              Sozlamalar
            </h1>
            <p className="text-muted-foreground font-inter">
              Ilovani shaxsiylashtiring
            </p>
          </div>
        </motion.div>

        {/* Theme Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MangaCard glowColor="blue" hover={false} className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/20">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-jetbrains font-bold text-foreground">
                  Editor Tema
                </h2>
                <p className="text-muted-foreground text-sm font-inter">
                  O'zingizga yoqqan professional temani tanlang
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t, index) => (
                <motion.div
                  key={t.id}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    theme === t.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-muted-foreground bg-card/50"
                  }`}
                  onClick={() => setTheme(t.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {theme === t.id && (
                    <motion.div 
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </motion.div>
                  )}

                  {/* Color Preview - Terminal style */}
                  <div className="mb-4 p-3 rounded-lg bg-[#0d0d0d] border border-border/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors[3] }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors[2] }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors[1] }} />
                    </div>
                    <div className="flex gap-1">
                      {t.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="h-6 flex-1 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    {t.icon && <t.icon className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="font-jetbrains font-bold text-foreground text-sm">
                      {t.name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-inter">
                    {t.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Current theme indicator */}
            <motion.div 
              className="mt-6 p-4 rounded-lg bg-muted/30 border border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-inter">Joriy tema:</p>
                  <p className="font-jetbrains font-bold text-foreground">
                    {themes.find(t => t.id === theme)?.name}
                  </p>
                </div>
                <div className="flex gap-1">
                  {themes.find(t => t.id === theme)?.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-8 w-8 rounded-lg border border-border/50"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </MangaCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
