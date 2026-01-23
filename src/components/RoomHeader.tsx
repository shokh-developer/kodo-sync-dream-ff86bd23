import { motion } from "framer-motion";
import { Users, Copy, Check, Wifi } from "lucide-react";
import { MangaButton } from "./MangaButton";
import LanguageSelector from "./LanguageSelector";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface RoomHeaderProps {
  roomId: string;
  roomName: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  onlineUsers?: number;
}

const RoomHeader = ({
  roomId,
  roomName,
  language,
  onLanguageChange,
  onlineUsers = 1,
}: RoomHeaderProps) => {
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
      className="flex flex-wrap items-center justify-between gap-4 p-4 bg-cyber-mid border-b border-border"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-orbitron font-bold text-gradient-manga">
            {roomName}
          </h1>
          <p className="text-sm text-muted-foreground font-rajdhani">
            Xona ID: {roomId.slice(0, 8)}...
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/50">
          <Wifi className="h-4 w-4 text-accent animate-pulse" />
          <Users className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">{onlineUsers}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSelector value={language} onChange={onLanguageChange} />
        
        <MangaButton
          variant="cyber"
          size="sm"
          onClick={copyRoomLink}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Nusxalandi!" : "Linkni nusxalash"}
        </MangaButton>
      </div>
    </motion.div>
  );
};

export default RoomHeader;
