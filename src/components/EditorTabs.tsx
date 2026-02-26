import { motion } from "framer-motion";
import { X, FileCode, Braces, Globe, Hash, FileJson, Terminal, FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTab {
  id: string;
  name: string;
  language: string;
}

interface EditorTabsProps {
  tabs: FileTab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  const iconClass = "h-3.5 w-3.5";
  
  switch (ext) {
    case "js":
    case "jsx":
      return <Braces className={cn(iconClass, "text-yellow-400")} />;
    case "ts":
    case "tsx":
      return <FileCode className={cn(iconClass, "text-blue-400")} />;
    case "html":
      return <Globe className={cn(iconClass, "text-orange-400")} />;
    case "css":
    case "scss":
      return <Hash className={cn(iconClass, "text-pink-400")} />;
    case "json":
      return <FileJson className={cn(iconClass, "text-yellow-300")} />;
    case "py":
      return <Terminal className={cn(iconClass, "text-green-400")} />;
    case "md":
      return <FileText className={cn(iconClass, "text-gray-400")} />;
    case "cpp":
    case "cc":
    case "cxx":
    case "c":
    case "h":
    case "hpp":
      return <FileCode className={cn(iconClass, "text-blue-500")} />;
    default:
      return <File className={cn(iconClass, "text-muted-foreground")} />;
  }
};

const EditorTabs = ({ tabs, activeTabId, onTabSelect, onTabClose }: EditorTabsProps) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-cyber-dark border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <motion.div
          key={tab.id}
          className={cn(
            "group flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
            activeTabId === tab.id
              ? "bg-card border-t-2 border-t-primary"
              : "bg-cyber-dark hover:bg-muted/30"
          )}
          onClick={() => onTabSelect(tab.id)}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          layout
        >
          {getFileIcon(tab.name)}
          <span
            className={cn(
              "text-sm font-rajdhani truncate flex-1",
              activeTabId === tab.id ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {tab.name}
          </span>
          <button
            className={cn(
              "p-0.5 rounded hover:bg-destructive/20 transition-colors",
              activeTabId === tab.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default EditorTabs;
