import { motion } from "framer-motion";
import { ArrowLeft, Palette, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MangaButton } from "@/components/MangaButton";
import { useTheme, Theme } from "@/contexts/ThemeContext";

const themes: { id: Theme; name: string; description: string; colors: string[] }[] = [
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "VS Code uslubidagi qorong'u ko'k-binafsha tema",
    colors: ["#1a1b26", "#7aa2f7", "#bb9af7", "#7dcfff"],
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 bg-gradient-night pointer-events-none" />
      <div className="fixed top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <MangaButton variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </MangaButton>
          <div>
            <h1 className="text-2xl font-space font-bold text-foreground tracking-tight">
              Sozlamalar
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ilovani shaxsiylashtiring
            </p>
          </div>
        </motion.div>

        {/* Theme Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-space font-bold text-foreground">
                  Editor Tema
                </h2>
                <p className="text-sm text-muted-foreground">
                  O'zingizga yoqqan temani tanlang
                </p>
              </div>
            </div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {themes.map((t) => (
                <motion.div
                  key={t.id}
                  variants={item}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 group ${
                    theme === t.id
                      ? "border-primary/50 bg-primary/[0.08] shadow-glow"
                      : "border-border/50 hover:border-border bg-card/30 hover:bg-card/50"
                  }`}
                  onClick={() => setTheme(t.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {theme === t.id && (
                    <motion.div 
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </motion.div>
                  )}

                  {/* Color Preview */}
                  <div className="mb-4 rounded-lg overflow-hidden border border-border/30">
                    <div className="h-3 flex">
                      {t.colors.map((color, idx) => (
                        <div key={idx} className="flex-1" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="p-2.5 space-y-1.5" style={{ backgroundColor: t.colors[0] }}>
                      <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: t.colors[1], opacity: 0.6 }} />
                      <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: t.colors[2], opacity: 0.4 }} />
                      <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: t.colors[3], opacity: 0.3 }} />
                    </div>
                  </div>

                  <h3 className="font-space font-semibold text-foreground text-sm mb-0.5">
                    {t.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Current theme */}
            <motion.div 
              className="mt-6 p-4 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div>
                <p className="text-xs text-muted-foreground">Joriy tema</p>
                <p className="font-space font-semibold text-foreground text-sm mt-0.5">
                  {themes.find(t => t.id === theme)?.name}
                </p>
              </div>
              <div className="flex gap-1">
                {themes.find(t => t.id === theme)?.colors.map((color, idx) => (
                  <div key={idx} className="h-7 w-7 rounded-lg border border-border/30" style={{ backgroundColor: color }} />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
