import { Users, Copy, Check, Wifi, Share2, Hash, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ZipManager from "./ZipManager";

interface FileItem {
  id: string; name: string; path: string; content: string; language: string; is_folder: boolean;
}

interface EditorHeaderProps {
  roomId: string; roomName: string; activeFileName?: string; onlineUsers?: number;
  files?: FileItem[];
  onFilesImported?: (files: { name: string; path: string; content: string; language: string }[]) => void;
}

const EditorHeader = ({ roomId, roomName, activeFileName, onlineUsers = 1, files = [], onFilesImported }: EditorHeaderProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const shortId = roomId.slice(0, 8);

  const copyRoomLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it and start coding together." });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    toast({ title: "ID copied!", description: roomId });
  };

  return (
    <div className="flex items-center justify-between h-10 px-3">
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-xs font-semibold text-foreground truncate">{roomName}</h1>
        <button onClick={copyRoomId} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary hover:bg-muted transition-colors duration-150 flex-shrink-0" title="Copy room ID">
          <Hash className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-jetbrains">{shortId}</span>
        </button>
        {activeFileName && (
          <>
            <span className="text-muted-foreground/40 hidden md:inline text-xs">/</span>
            <span className="text-[11px] text-primary/80 font-medium hidden md:inline truncate">{activeFileName}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onFilesImported && <ZipManager files={files} onFilesImported={onFilesImported} roomName={roomName} />}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-1.5 hidden sm:flex">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Synced</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-foreground text-[11px]">{onlineUsers}</span>
        </div>
        <Button size="sm" variant="default" className="h-7 text-[11px] px-2.5" onClick={copyRoomLink}>
          {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
          <span className="hidden sm:inline ml-1">{copied ? "Copied!" : "Share"}</span>
        </Button>
      </div>
    </div>
  );
};

export default EditorHeader;
