import { motion } from "framer-motion";
import { Users, Copy, Check, Wifi, Share2, Hash, Flame } from "lucide-react";
import { MangaButton } from "./MangaButton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EditorHeaderProps {
  roomId: string;
  roomName: string;
  activeFileName?: string;
  onlineUsers?: number;
}

const EditorHeader = ({
  roomId,
  roomName,
  activeFileName,
  onlineUsers = 1,
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
      className="flex items-center justify-between h-12 px-4 bg-cyber-mid border-b border-border"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="text-sm font-orbitron font-bold text-primary hidden lg:inline">
            CodeForge
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border hidden md:block" />

        {/* Room Name */}
        <h1 className="text-base font-orbitron font-bold text-foreground">
          {roomName}
        </h1>

        {/* Room ID */}
        <button
          onClick={copyRoomId}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 hover:bg-muted transition-colors group"
          title="ID ni nusxalash uchun bosing"
        >
          <Hash className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground font-mono">
            {shortId}
          </span>
        </button>

        {/* Active File */}
        {activeFileName && (
          <>
            <span className="text-muted-foreground hidden md:inline">/</span>
            <span className="text-sm text-accent font-rajdhani font-medium hidden md:inline">
              {activeFileName}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Sync status */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="hidden lg:inline">Sinxron</span>
        </div>

        {/* Online users indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/50">
          <Wifi className="h-3.5 w-3.5 text-accent animate-pulse" />
          <Users className="h-3.5 w-3.5 text-accent" />
          <span className="text-sm font-medium text-accent">{onlineUsers}</span>
        </div>

        {/* Share button */}
        <MangaButton variant="cyber" size="sm" onClick={copyRoomLink}>
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          <span className="hidden md:inline">{copied ? "Nusxalandi!" : "Ulashish"}</span>
        </MangaButton>
      </div>
    </motion.div>
  );
};

export default EditorHeader;
