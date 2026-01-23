import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  FileCode,
  FileJson,
  FileText,
  Braces,
  Hash,
  Terminal,
  Globe,
  X,
  Check,
  FolderPlus,
  FilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  is_folder: boolean;
}

interface FileExplorerProps {
  files: FileItem[];
  activeFileId: string | null;
  onFileSelect: (file: FileItem) => void;
  onCreateFile: (name: string, path: string, isFolder: boolean, language?: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

const getFileIcon = (name: string, language: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  
  switch (ext) {
    case "js":
    case "jsx":
      return <Braces className="h-4 w-4 text-yellow-400" />;
    case "ts":
    case "tsx":
      return <FileCode className="h-4 w-4 text-blue-400" />;
    case "html":
      return <Globe className="h-4 w-4 text-orange-400" />;
    case "css":
    case "scss":
      return <Hash className="h-4 w-4 text-pink-400" />;
    case "json":
      return <FileJson className="h-4 w-4 text-yellow-300" />;
    case "py":
      return <Terminal className="h-4 w-4 text-green-400" />;
    case "md":
      return <FileText className="h-4 w-4 text-gray-400" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
};

const getLanguageFromName = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "html":
      return "html";
    case "css":
    case "scss":
      return "css";
    case "json":
      return "json";
    case "py":
      return "python";
    case "md":
      return "markdown";
    case "sql":
      return "sql";
    default:
      return "plaintext";
  }
};

const FileExplorer = ({
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]))
  const [isCreating, setIsCreating] = useState<{ type: "file" | "folder"; path: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreate = () => {
    if (!newName.trim() || !isCreating) return;
    
    const language = isCreating.type === "file" ? getLanguageFromName(newName) : "javascript";
    onCreateFile(newName.trim(), isCreating.path, isCreating.type === "folder", language);
    setNewName("");
    setIsCreating(null);
  };

  const handleRename = (fileId: string) => {
    if (!editName.trim()) return;
    onRenameFile(fileId, editName.trim());
    setEditingId(null);
    setEditName("");
  };

  const startEditing = (file: FileItem) => {
    setEditingId(file.id);
    setEditName(file.name);
  };

  // Build tree structure
  const buildTree = (files: FileItem[], currentPath: string = "/") => {
    const items = files.filter(f => f.path === currentPath);
    const folders = items.filter(f => f.is_folder);
    const regularFiles = items.filter(f => !f.is_folder);
    
    return [...folders, ...regularFiles];
  };

  const renderItem = (file: FileItem, depth: number = 0) => {
    const isActive = activeFileId === file.id;
    const isExpanded = expandedFolders.has(file.path + file.name + "/");
    const childPath = file.path + file.name + "/";
    const children = files.filter(f => f.path === childPath);

    return (
      <div key={file.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <motion.div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md text-sm font-rajdhani transition-colors",
                isActive
                  ? "bg-primary/20 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => {
                if (file.is_folder) {
                  toggleFolder(childPath);
                } else {
                  onFileSelect(file);
                }
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: depth * 0.05 }}
            >
              {file.is_folder ? (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Folder className="h-4 w-4 text-yellow-500" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-4" />
                  {getFileIcon(file.name, file.language)}
                </>
              )}
              
              {editingId === file.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-6 text-xs bg-cyber-dark border-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(file.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Check
                    className="h-4 w-4 text-accent cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(file.id);
                    }}
                  />
                  <X
                    className="h-4 w-4 text-destructive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                  />
                </div>
              ) : (
                <span className="truncate flex-1">{file.name}</span>
              )}
            </motion.div>
          </ContextMenuTrigger>
          
          <ContextMenuContent className="bg-cyber-mid border-border">
            {file.is_folder && (
              <>
                <ContextMenuItem
                  className="text-foreground hover:bg-muted cursor-pointer"
                  onClick={() => setIsCreating({ type: "file", path: childPath })}
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  Yangi fayl
                </ContextMenuItem>
                <ContextMenuItem
                  className="text-foreground hover:bg-muted cursor-pointer"
                  onClick={() => setIsCreating({ type: "folder", path: childPath })}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Yangi papka
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-border" />
              </>
            )}
            <ContextMenuItem
              className="text-foreground hover:bg-muted cursor-pointer"
              onClick={() => startEditing(file)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Nomini o'zgartirish
            </ContextMenuItem>
            <ContextMenuItem
              className="text-destructive hover:bg-destructive/20 cursor-pointer"
              onClick={() => onDeleteFile(file.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              O'chirish
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Render children if folder is expanded */}
        <AnimatePresence>
          {file.is_folder && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children.map(child => renderItem(child, depth + 1))}
              
              {/* New item input inside folder */}
              {isCreating?.path === childPath && (
                <div
                  className="flex items-center gap-2 px-2 py-1"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                >
                  {isCreating.type === "folder" ? (
                    <Folder className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isCreating.type === "folder" ? "papka nomi..." : "fayl nomi..."}
                    className="h-6 text-xs bg-cyber-dark border-primary flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") setIsCreating(null);
                    }}
                  />
                  <Check
                    className="h-4 w-4 text-accent cursor-pointer"
                    onClick={handleCreate}
                  />
                  <X
                    className="h-4 w-4 text-destructive cursor-pointer"
                    onClick={() => setIsCreating(null)}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const rootItems = buildTree(files, "/");

  return (
    <div className="h-full flex flex-col bg-cyber-dark border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-xs font-orbitron text-muted-foreground uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-muted transition-colors"
            onClick={() => setIsCreating({ type: "file", path: "/" })}
            title="Yangi fayl"
          >
            <FilePlus className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted transition-colors"
            onClick={() => setIsCreating({ type: "folder", path: "/" })}
            title="Yangi papka"
          >
            <FolderPlus className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </button>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {rootItems.map(item => renderItem(item, 0))}
        
        {/* New item input at root */}
        {isCreating?.path === "/" && (
          <div className="flex items-center gap-2 px-2 py-1 ml-2">
            {isCreating.type === "folder" ? (
              <Folder className="h-4 w-4 text-yellow-500" />
            ) : (
              <File className="h-4 w-4 text-muted-foreground" />
            )}
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isCreating.type === "folder" ? "papka nomi..." : "fayl nomi..."}
              className="h-6 text-xs bg-cyber-dark border-primary flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsCreating(null);
              }}
            />
            <Check className="h-4 w-4 text-accent cursor-pointer" onClick={handleCreate} />
            <X className="h-4 w-4 text-destructive cursor-pointer" onClick={() => setIsCreating(null)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
