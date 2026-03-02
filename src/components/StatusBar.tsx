import { Braces, Hash, Terminal, Globe, FileCode, FileJson, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  language: string; fileName?: string; line?: number; column?: number;
}

const getLanguageIcon = (language: string) => {
  const cls = "h-3 w-3";
  switch (language) {
    case "javascript": return <Braces className={cn(cls, "text-yellow-400")} />;
    case "typescript": return <FileCode className={cn(cls, "text-blue-400")} />;
    case "html": return <Globe className={cn(cls, "text-orange-400")} />;
    case "css": return <Hash className={cn(cls, "text-pink-400")} />;
    case "json": return <FileJson className={cn(cls, "text-yellow-300")} />;
    case "python": return <Terminal className={cn(cls, "text-green-400")} />;
    case "markdown": return <FileText className={cn(cls, "text-gray-400")} />;
    default: return <File className={cn(cls, "text-muted-foreground")} />;
  }
};

const StatusBar = ({ language, fileName, line = 1, column = 1 }: StatusBarProps) => {
  return (
    <div className="flex items-center justify-between h-6 px-3 bg-card border-t border-border text-[11px] flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Synced</span>
        </div>
        {fileName && <span className="text-muted-foreground hidden sm:inline">{fileName}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">Ln {line}, Col {column}</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary">
          {getLanguageIcon(language)}
          <span className="text-foreground capitalize">{language}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
