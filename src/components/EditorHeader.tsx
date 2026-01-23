import { motion } from "framer-motion";
import { Users, Copy, Check, Wifi, Settings, Share2 } from "lucide-react";
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

  return (
    <motion.div
      className="flex items-center justify-between h-12 px-4 bg-cyber-mid border-b border-border"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-orbitron font-bold text-gradient-manga">
          {roomName}
        </h1>
        {activeFileName && (
          <span className="text-sm text-muted-foreground font-rajdhani">
            / {activeFileName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
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
          {copied ? "Nusxalandi!" : "Ulashish"}
        </MangaButton>
      </div>
    </motion.div>
  );
};

export default EditorHeader;
