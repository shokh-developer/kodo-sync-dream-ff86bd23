import { motion } from "framer-motion";
import { ArrowLeft, Palette, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MangaButton } from "@/components/MangaButton";
import { MangaCard } from "@/components/MangaCard";
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
];

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-orbitron font-bold text-gradient-tokyo">
              Sozlamalar
            </h1>
            <p className="text-muted-foreground">Ilovani shaxsiylashtiring</p>
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
                <h2 className="text-xl font-orbitron font-bold text-foreground">
                  Dizayn temasi
                </h2>
                <p className="text-muted-foreground text-sm">
                  O'zingizga yoqqan temani tanlang
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {themes.map((t) => (
                <motion.div
                  key={t.id}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    theme === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground bg-muted/30"
                  }`}
                  onClick={() => setTheme(t.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {theme === t.id && (
                    <div className="absolute top-3 right-3 p-1 rounded-full bg-primary">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}

                  {/* Color Preview */}
                  <div className="flex gap-2 mb-4">
                    {t.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-8 w-8 rounded-lg border border-border/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <h3 className="font-orbitron font-bold text-foreground mb-1">
                    {t.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </MangaCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
