import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useRoom, useFiles, joinRoom } from "@/hooks/useFiles";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import CodeEditor from "@/components/CodeEditor";
import FileExplorer from "@/components/FileExplorer";
import EditorTabs from "@/components/EditorTabs";
import EditorHeader from "@/components/EditorHeader";
import EditorWelcome from "@/components/EditorWelcome";
import StatusBar from "@/components/StatusBar";
import Terminal from "@/components/Terminal";
import RoomChat from "@/components/RoomChat";
import AdminPanel from "@/components/AdminPanel";
import AIAssistant from "@/components/AIAssistant";
import { MangaButton } from "@/components/MangaButton";
import { ArrowLeft, Loader2, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { debounce } from "@/lib/utils";

const Room = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { room, loading: roomLoading, error } = useRoom(id || null);
  const { user, isAuthenticated } = useAuth();
  const {
    files,
    activeFile,
    setActiveFile,
    loading: filesLoading,
    createFile,
    updateFileContent,
    deleteFile,
    renameFile,
  } = useFiles(room?.id || null);
  const { onlineUsers } = usePresence(room?.id || null);
  const { isModerator } = useAdmin();

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [localContent, setLocalContent] = useState("");

  // Join room when user enters
  useEffect(() => {
    if (room?.id && isAuthenticated) {
      joinRoom(room.id);
    }
  }, [room?.id, isAuthenticated]);

  // Sync local content with active file when it changes from realtime updates
  useEffect(() => {
    if (activeFile && activeFile.content !== localContent) {
      setLocalContent(activeFile.content);
    }
  }, [activeFile?.content]);

  // Sync local content with active file
  const handleFileSelect = (file: typeof activeFile) => {
    if (!file || file.is_folder) return;
    setActiveFile(file);
    setLocalContent(file.content);
    
    if (!openTabs.includes(file.id)) {
      setOpenTabs(prev => [...prev, file.id]);
    }
  };

  // Debounced save
  const debouncedSave = useCallback(
    debounce((fileId: string, content: string) => {
      updateFileContent(fileId, content);
    }, 500),
    [updateFileContent]
  );

  const handleCodeChange = (newContent: string) => {
    setLocalContent(newContent);
    if (activeFile) {
      debouncedSave(activeFile.id, newContent);
    }
  };

  const handleTabClose = (tabId: string) => {
    setOpenTabs(prev => prev.filter(id => id !== tabId));
    if (activeFile?.id === tabId) {
      const remaining = openTabs.filter(id => id !== tabId);
      if (remaining.length > 0) {
        const nextFile = files.find(f => f.id === remaining[remaining.length - 1]);
        if (nextFile) {
          setActiveFile(nextFile);
          setLocalContent(nextFile.content);
        }
      } else {
        setActiveFile(null);
      }
    }
  };

  const handleTabSelect = (tabId: string) => {
    const file = files.find(f => f.id === tabId);
    if (file) {
      setActiveFile(file);
      setLocalContent(file.content);
    }
  };

  const handleCreateFile = async (name: string, path: string, isFolder: boolean, language?: string) => {
    const newFile = await createFile(name, path, isFolder, language);
    if (newFile && !isFolder) {
      handleFileSelect(newFile);
    }
  };

  const loading = roomLoading || filesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-lg font-orbitron text-muted-foreground">
            Xona yuklanmoqda...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-cyber flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 className="text-3xl font-orbitron font-bold text-destructive mb-4">
            Xona topilmadi
          </h1>
          <p className="text-muted-foreground font-rajdhani mb-6">
            Bu xona mavjud emas yoki o'chirilgan
          </p>
          <MangaButton variant="primary" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifaga qaytish
          </MangaButton>
        </motion.div>
      </div>
    );
  }

  const openTabFiles = files.filter(f => openTabs.includes(f.id));

  return (
    <div className="h-screen flex flex-col bg-gradient-cyber overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-cyber-dark border-b border-border">
        <MangaButton
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="h-12 w-12 rounded-none border-r border-border"
        >
          <ArrowLeft className="h-5 w-5" />
        </MangaButton>
        
        <MangaButton
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-12 w-12 rounded-none border-r border-border"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </MangaButton>
        
        {/* Admin Panel in Header */}
        {isModerator && (
          <div className="flex items-center border-r border-border px-2">
            <AdminPanel roomId={id} />
          </div>
        )}
        
        <div className="flex-1">
          <EditorHeader
            roomId={room.id}
            roomName={room.name}
            activeFileName={activeFile?.name}
            onlineUsers={onlineUsers}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-[260px] h-full">
            <FileExplorer
              files={files}
              activeFileId={activeFile?.id || null}
              onFileSelect={handleFileSelect}
              onCreateFile={handleCreateFile}
              onDeleteFile={deleteFile}
              onRenameFile={renameFile}
            />
          </div>
        </motion.div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <EditorTabs
            tabs={openTabFiles.map(f => ({ id: f.id, name: f.name, language: f.language }))}
            activeTabId={activeFile?.id || null}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
          />

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <CodeEditor
                code={localContent}
                language={activeFile.language}
                onChange={handleCodeChange}
              />
            ) : (
              <EditorWelcome />
            )}
          </div>

          {/* Terminal */}
          <Terminal
            isOpen={terminalOpen}
            onToggle={() => setTerminalOpen(!terminalOpen)}
            code={localContent}
            language={activeFile?.language || "javascript"}
          />

          {/* Status bar */}
          <StatusBar
            language={activeFile?.language || "plaintext"}
            fileName={activeFile?.name}
          />
        </div>
      </div>

      {/* Chat */}
      <RoomChat roomId={id || ""} />

      {/* AI Assistant */}
      <AIAssistant code={localContent} language={activeFile?.language || "javascript"} />
    </div>
  );
};

export default Room;
