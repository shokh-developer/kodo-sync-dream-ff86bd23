import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useRoom } from "@/hooks/useRoom";
import CodeEditor from "@/components/CodeEditor";
import RoomHeader from "@/components/RoomHeader";
import { MangaButton } from "@/components/MangaButton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { debounce } from "@/lib/utils";

const Room = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { room, loading, error, updateCode, updateLanguage } = useRoom(id || null);
  const [localCode, setLocalCode] = useState("");

  useEffect(() => {
    if (room?.code !== undefined && room.code !== localCode) {
      setLocalCode(room.code);
    }
  }, [room?.code]);

  // Debounced update to prevent too many writes
  const debouncedUpdateCode = useCallback(
    debounce((newCode: string) => {
      updateCode(newCode);
    }, 500),
    [updateCode]
  );

  const handleCodeChange = (newCode: string) => {
    setLocalCode(newCode);
    debouncedUpdateCode(newCode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-lg font-orbitron text-muted-foreground">
            Xona yuklanmoqda...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 className="text-3xl font-orbitron font-bold text-destructive mb-4">
            Xona topilmadi
          </h1>
          <p className="text-muted-foreground font-rajdhani mb-6">
            Bu xona mavjud emas yoki o'chirilgan
          </p>
          <MangaButton variant="primary" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifaga qaytish
          </MangaButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cyber flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-2 bg-cyber-dark border-b border-border">
        <MangaButton
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </MangaButton>
        <div className="flex-1">
          <RoomHeader
            roomId={room.id}
            roomName={room.name}
            language={room.language}
            onLanguageChange={updateLanguage}
          />
        </div>
      </div>

      {/* Editor */}
      <motion.div
        className="flex-1 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="h-full manga-panel rounded-xl overflow-hidden">
          <CodeEditor
            code={localCode}
            language={room.language}
            onChange={handleCodeChange}
          />
        </div>
      </motion.div>

      {/* Footer */}
      <div className="p-3 bg-cyber-dark border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-muted-foreground font-rajdhani">
            Real-time sinxronizatsiya faol
          </span>
        </div>
        <span className="text-sm text-muted-foreground font-rajdhani">
          Til: <span className="text-primary font-medium">{room.language}</span>
        </span>
      </div>
    </div>
  );
};

export default Room;
