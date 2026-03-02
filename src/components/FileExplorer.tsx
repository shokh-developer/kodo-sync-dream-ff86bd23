import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen, Trash2, Edit2,
  FileCode, FileJson, FileText, Braces, Hash, Terminal, Globe, X, Check, FolderPlus, FilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface FileItem {
  id: string; name: string; path: string; content: string; language: string; is_folder: boolean;
}

interface FileExplorerProps {
  files: FileItem[]; activeFileId: string | null;
  onFileSelect: (file: FileItem) => void;
  onCreateFile: (name: string, path: string, isFolder: boolean, language?: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

const getFileIcon = (name: string, language: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  const cls = "h-4 w-4";
  switch (ext) {
    case "js": case "jsx": return <Braces className={cn(cls, "text-yellow-400")} />;
    case "ts": case "tsx": return <FileCode className={cn(cls, "text-blue-400")} />;
    case "html": return <Globe className={cn(cls, "text-orange-400")} />;
    case "css": case "scss": return <Hash className={cn(cls, "text-pink-400")} />;
    case "json": return <FileJson className={cn(cls, "text-yellow-300")} />;
    case "py": return <Terminal className={cn(cls, "text-green-400")} />;
    case "md": return <FileText className={cn(cls, "text-gray-400")} />;
    case "cpp": case "cc": case "c": case "h": case "hpp": return <FileCode className={cn(cls, "text-blue-500")} />;
    case "java": return <FileCode className={cn(cls, "text-red-400")} />;
    case "go": return <FileCode className={cn(cls, "text-cyan-400")} />;
    case "rs": return <FileCode className={cn(cls, "text-orange-500")} />;
    default: return <File className={cn(cls, "text-muted-foreground")} />;
  }
};

const getLanguageFromName = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    html: "html", css: "css", scss: "css", json: "json", py: "python", md: "markdown",
    cpp: "cpp", cc: "cpp", c: "c", h: "cpp", hpp: "cpp", java: "java", go: "go",
    rs: "rust", php: "php", rb: "ruby", swift: "swift", kt: "kotlin", dart: "dart",
    lua: "lua", sh: "bash", sql: "sql", scala: "scala", pl: "perl", r: "r",
  };
  return map[ext || ""] || "plaintext";
};

const FileExplorer = ({ files, activeFileId, onFileSelect, onCreateFile, onDeleteFile, onRenameFile }: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]))
  const [isCreating, setIsCreating] = useState<{ type: "file" | "folder"; path: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleCreate = () => {
    if (!newName.trim() || !isCreating) return;
    onCreateFile(newName.trim(), isCreating.path, isCreating.type === "folder", getLanguageFromName(newName));
    setNewName(""); setIsCreating(null);
  };

  const handleRename = (fileId: string) => {
    if (!editName.trim()) return;
    onRenameFile(fileId, editName.trim());
    setEditingId(null); setEditName("");
  };

  const buildTree = (currentPath: string = "/") => {
    const items = files.filter(f => f.path === currentPath);
    return [...items.filter(f => f.is_folder), ...items.filter(f => !f.is_folder)];
  };

  const renderItem = (file: FileItem, depth: number = 0) => {
    const isActive = activeFileId === file.id;
    const childPath = file.path + file.name + "/";
    const isExpanded = expandedFolders.has(childPath);
    const children = files.filter(f => f.path === childPath);

    return (
      <div key={file.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs transition-colors duration-100",
                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => file.is_folder ? toggleFolder(childPath) : onFileSelect(file)}
            >
              {file.is_folder ? (
                <>
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                  {isExpanded ? <FolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" /> : <Folder className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                </>
              ) : (
                <>
                  <span className="w-3.5 flex-shrink-0" />
                  {getFileIcon(file.name, file.language)}
                </>
              )}
              {editingId === file.id ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-5 text-xs px-1" autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleRename(file.id); if (e.key === "Escape") setEditingId(null); }}
                    onClick={(e) => e.stopPropagation()} />
                  <Check className="h-3.5 w-3.5 text-primary cursor-pointer flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleRename(file.id); }} />
                  <X className="h-3.5 w-3.5 text-destructive cursor-pointer flex-shrink-0" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} />
                </div>
              ) : (
                <span className="truncate flex-1">{file.name}</span>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {file.is_folder && (
              <>
                <ContextMenuItem onClick={() => setIsCreating({ type: "file", path: childPath })} className="cursor-pointer">
                  <FilePlus className="h-4 w-4 mr-2" /> New file
                </ContextMenuItem>
                <ContextMenuItem onClick={() => setIsCreating({ type: "folder", path: childPath })} className="cursor-pointer">
                  <FolderPlus className="h-4 w-4 mr-2" /> New folder
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem onClick={() => { setEditingId(file.id); setEditName(file.name); }} className="cursor-pointer">
              <Edit2 className="h-4 w-4 mr-2" /> Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onDeleteFile(file.id)} className="text-destructive cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <AnimatePresence>
          {file.is_folder && isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
              {children.map(child => renderItem(child, depth + 1))}
              {isCreating?.path === childPath && renderCreateInput(depth + 1)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderCreateInput = (depth: number) => (
    <div className="flex items-center gap-1.5 px-2 py-1" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
      {isCreating?.type === "folder" ? <Folder className="h-4 w-4 text-yellow-500" /> : <File className="h-4 w-4 text-muted-foreground" />}
      <Input value={newName} onChange={(e) => setNewName(e.target.value)}
        placeholder={isCreating?.type === "folder" ? "folder name..." : "file name..."}
        className="h-5 text-xs px-1 flex-1" autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setIsCreating(null); }} />
      <Check className="h-3.5 w-3.5 text-primary cursor-pointer" onClick={handleCreate} />
      <X className="h-3.5 w-3.5 text-destructive cursor-pointer" onClick={() => setIsCreating(null)} />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Explorer</span>
        <div className="flex items-center gap-0.5">
          <button className="p-1 rounded hover:bg-secondary transition-colors duration-150" onClick={() => setIsCreating({ type: "file", path: "/" })} title="New file">
            <FilePlus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button className="p-1 rounded hover:bg-secondary transition-colors duration-150" onClick={() => setIsCreating({ type: "folder", path: "/" })} title="New folder">
            <FolderPlus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {buildTree("/").map(item => renderItem(item, 0))}
        {isCreating?.path === "/" && renderCreateInput(0)}
      </div>
    </div>
  );
};

export default FileExplorer;
