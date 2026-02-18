import { motion } from "framer-motion";
import { Users, Copy, Check, Wifi, Share2, Hash, Sparkles } from "lucide-react";
import { MangaButton } from "./MangaButton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ZipManager from "./ZipManager";

interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  is_folder: boolean;
}

interface EditorHeaderProps {
  roomId: string;
  roomName: string;
  activeFileName?: string;
  onlineUsers?: number;
  files?: FileItem[];
  onFilesImported?: (files: { name: string; path: string; content: string; language: string }[]) => void;
}

const EditorHeader = ({
  roomId,
  roomName,
  activeFileName,
  onlineUsers = 1,
  files = [],
  onFilesImported,
}: EditorHeaderProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shortId = roomId.slice(0, 8);

  const copyRoomLink = async () => {
    const link = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link nusxalandi!",
      description: "Do'stingizga yuboring va birga kod yozing!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    toast({
      title: "ID nusxalandi!",
      description: roomId,
    });
  };

  return (
    <motion.div
      className="flex items-center justify-between h-12 px-4 bg-card/60 backdrop-blur-sm border-b border-border/50"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-space font-bold text-primary hidden lg:inline tracking-tight">
            CodeForge
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border/50 hidden md:block" />

        {/* Room Name */}
        <h1 className="text-sm font-space font-semibold text-foreground tracking-tight">
          {roomName}
        </h1>

        {/* Room ID */}
        <button
          onClick={copyRoomId}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          title="ID ni nusxalash uchun bosing"
        >
          <Hash className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground font-jetbrains transition-colors">
            {shortId}
          </span>
        </button>

        {/* Active File */}
        {activeFileName && (
          <>
            <span className="text-muted-foreground/40 hidden md:inline">/</span>
            <span className="text-xs text-primary/80 font-medium hidden md:inline">
              {activeFileName}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* ZIP Manager */}
        {onFilesImported && (
          <ZipManager 
            files={files} 
            onFilesImported={onFilesImported}
            roomName={roomName}
          />
        )}

        {/* Sync status */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
          <span className="hidden lg:inline">Sinxron</span>
        </div>

        {/* Online users */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/20 border border-border/30">
          <Wifi className="h-3 w-3 text-accent" />
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">{onlineUsers}</span>
        </div>

        {/* Share button */}
        <MangaButton variant="primary" size="sm" onClick={copyRoomLink}>
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          <span className="hidden md:inline">{copied ? "Nusxalandi!" : "Ulashish"}</span>
        </MangaButton>
      </div>
    </motion.div>
  );
};

export default EditorHeader;
