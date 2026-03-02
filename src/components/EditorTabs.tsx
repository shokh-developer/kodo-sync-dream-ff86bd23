import { X, FileCode, Braces, Globe, Hash, FileJson, Terminal, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTab { id: string; name: string; language: string; }

interface EditorTabsProps {
  tabs: FileTab[]; activeTabId: string | null;
  onTabSelect: (id: string) => void; onTabClose: (id: string) => void;
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  const cls = "h-3.5 w-3.5";
  switch (ext) {
    case "js": case "jsx": return <Braces className={cn(cls, "text-yellow-400")} />;
    case "ts": case "tsx": return <FileCode className={cn(cls, "text-blue-400")} />;
    case "html": return <Globe className={cn(cls, "text-orange-400")} />;
    case "css": case "scss": return <Hash className={cn(cls, "text-pink-400")} />;
    case "json": return <FileJson className={cn(cls, "text-yellow-300")} />;
    case "py": return <Terminal className={cn(cls, "text-green-400")} />;
    case "md": return <FileText className={cn(cls, "text-gray-400")} />;
    case "cpp": case "cc": case "c": case "h": case "hpp": return <FileCode className={cn(cls, "text-blue-500")} />;
    default: return <File className={cn(cls, "text-muted-foreground")} />;
  }
};

const EditorTabs = ({ tabs, activeTabId, onTabSelect, onTabClose }: EditorTabsProps) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-card border-b border-border overflow-x-auto flex-shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "group flex items-center gap-1.5 px-3 py-1.5 border-r border-border cursor-pointer transition-colors duration-150 min-w-[100px] max-w-[180px] text-xs",
            activeTabId === tab.id
              ? "bg-background border-t-2 border-t-primary text-foreground"
              : "bg-card hover:bg-secondary text-muted-foreground"
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          {getFileIcon(tab.name)}
          <span className="truncate flex-1">{tab.name}</span>
          <button
            className={cn(
              "p-0.5 rounded hover:bg-destructive/20 transition-colors duration-150",
              activeTabId === tab.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;
