import { Braces, Hash, Terminal, Globe, FileCode, FileJson, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  language: string;
  fileName?: string;
  line?: number;
  column?: number;
}

const getLanguageIcon = (language: string) => {
  const iconClass = "h-3.5 w-3.5";
  
  switch (language) {
    case "javascript":
      return <Braces className={cn(iconClass, "text-yellow-400")} />;
    case "typescript":
      return <FileCode className={cn(iconClass, "text-blue-400")} />;
    case "html":
    case "vue":
    case "svelte":
      return <Globe className={cn(iconClass, "text-orange-400")} />;
    case "css":
    case "scss":
    case "sass":
      return <Hash className={cn(iconClass, "text-pink-400")} />;
    case "sql":
      return <FileText className={cn(iconClass, "text-amber-400")} />;
    case "php":
      return <FileCode className={cn(iconClass, "text-indigo-400")} />;
    case "json":
      return <FileJson className={cn(iconClass, "text-yellow-300")} />;
    case "python":
      return <Terminal className={cn(iconClass, "text-green-400")} />;
    case "markdown":
      return <FileText className={cn(iconClass, "text-gray-400")} />;
    case "cpp":
    case "c":
      return <FileCode className={cn(iconClass, "text-blue-500")} />;
    default:
      return <File className={cn(iconClass, "text-muted-foreground")} />;
  }
};

const StatusBar = ({ language, fileName, line = 1, column = 1 }: StatusBarProps) => {
  return (
    <div className="flex items-center justify-between h-6 px-4 bg-cyber-dark border-t border-border text-xs font-rajdhani">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-muted-foreground">Real-time sinxron</span>
        </div>
        
        {fileName && (
          <span className="text-muted-foreground">
            {fileName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          Ln {line}, Col {column}
        </span>
        
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/50">
          {getLanguageIcon(language)}
          <span className="text-foreground capitalize">{language}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
