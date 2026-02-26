import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useRoom, useFiles, joinRoom } from "@/hooks/useFiles";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import CodeEditorWithAI from "@/components/CodeEditorWithAI";
import FileExplorer from "@/components/FileExplorer";
import EditorTabs from "@/components/EditorTabs";
import EditorHeader from "@/components/EditorHeader";
import EditorWelcome from "@/components/EditorWelcome";
import StatusBar from "@/components/StatusBar";
import Terminal from "@/components/Terminal";
import RoomChat from "@/components/RoomChat";
import VoiceChat from "@/components/VoiceChat";
import AdminPanel from "@/components/AdminPanel";
import AIAssistant from "@/components/AIAssistant";
import { MangaButton } from "@/components/MangaButton";
import { ArrowLeft, Loader2, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { debounce } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Room = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [terminalOpen, setTerminalOpen] = useState(true); // Open by default
  const [localContent, setLocalContent] = useState("");

  const checkRoomAccess = useCallback(
    async (roomId: string) => {
      if (!user) return { allowed: false, reason: "not-authenticated" as const };

      const { data: bans } = await supabase
        .from("user_bans")
        .select("ban_type, expires_at")
        .eq("user_id", user.id)
        .or(`room_id.eq.${roomId},room_id.is.null`);

      const now = new Date();
      const isActive = (expiresAt: string | null) => !expiresAt || new Date(expiresAt) > now;
      const hasBan = (bans || []).some((b) => b.ban_type === "ban" && isActive(b.expires_at));
      if (hasBan) return { allowed: false, reason: "banned" as const };
      return { allowed: true, reason: null };
    },
    [user]
  );

  // Join room when user enters
  useEffect(() => {
    if (!room?.id || !isAuthenticated || !user) return;

    const enterRoom = async () => {
      const access = await checkRoomAccess(room.id);
      if (!access.allowed) {
        toast({
          title: "Access denied",
          description:
            access.reason === "banned"
              ? "You are banned and cannot enter this room."
              : "Access denied.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      const result = await joinRoom(room.id);
      if (result?.error) {
        const message = (result.error.message || "").toLowerCase();
        const isHardBlock =
          message.includes("banned") || message.includes("kicked");

        if (isHardBlock) {
          toast({
            title: "Access denied",
            description: result.error.message,
            variant: "destructive",
          });
          navigate("/", { replace: true });
        } else {
          // Membership sync is optional for editor usage; keep silent for users.
          console.warn("Room membership sync skipped:", result.error.message);
        }
      }
    };

    enterRoom();
  }, [room?.id, isAuthenticated, user?.id, checkRoomAccess, navigate, toast]);

  // Realtime ban enforcement while user is inside room.
  useEffect(() => {
    if (!room?.id || !user?.id) return;

    const channel = supabase
      .channel(`room-access:${room.id}:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_bans",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const access = await checkRoomAccess(room.id);
          if (!access.allowed) {
            toast({
              title: "Removed from room",
              description:
                access.reason === "banned"
                  ? "You were banned from this room."
                  : "Access denied.",
              variant: "destructive",
            });
            navigate("/", { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, user?.id, checkRoomAccess, navigate, toast]);

  // Kick enforcement: if membership is deleted, user is removed from room.
  useEffect(() => {
    if (!room?.id || !user?.id) return;

    const channel = supabase
      .channel(`room-membership:${room.id}:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_members",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedRoomId = (payload.old as any)?.room_id;
          if (deletedRoomId === room.id) {
            toast({
              title: "Removed from room",
              description: "You were kicked from this room.",
              variant: "destructive",
            });
            navigate("/", { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, user?.id, navigate, toast]);

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
            Loading room...
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
            Room not found
          </h1>
          <p className="text-muted-foreground font-rajdhani mb-6">
            This room does not exist or was deleted
          </p>
          <MangaButton variant="primary" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Back to home
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
            files={files}
            onFilesImported={async (importedFiles) => {
              // First create all unique folders
              const folderPaths = new Set<string>();
              for (const file of importedFiles) {
                // Extract all intermediate folder paths
                const parts = file.path.split("/").filter(Boolean);
                let currentPath = "/";
                for (const part of parts) {
                  const folderFullPath = currentPath + part + "/";
                  folderPaths.add(JSON.stringify({ name: part, path: currentPath }));
                  currentPath = folderFullPath;
                }
              }
              
              // Create folders first
              for (const folderJson of folderPaths) {
                const { name, path } = JSON.parse(folderJson);
                // Check if folder already exists
                const exists = files.some(f => f.is_folder && f.name === name && f.path === path);
                if (!exists) {
                  await createFile(name, path, true);
                }
              }

              // Then create files
              for (const file of importedFiles) {
                await createFile(file.name, file.path, false, file.language, file.content);
              }
            }}
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
              <CodeEditorWithAI
                code={localContent}
                language={activeFile.language}
                onChange={handleCodeChange}
                files={files}
              />
            ) : (
              <EditorWelcome />
            )}
          </div>

          {/* Terminal - with linked files support */}
          <Terminal
            isOpen={terminalOpen}
            onToggle={() => setTerminalOpen(!terminalOpen)}
            code={localContent}
            language={activeFile?.language || "javascript"}
            files={files}
            activeFile={activeFile}
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

      {/* Voice Chat */}
      <VoiceChat roomId={id || ""} />

      {/* AI Assistant - GitHub Copilot style */}
      <AIAssistant 
        code={localContent} 
        language={activeFile?.language || "javascript"}
        files={files}
        activeFile={activeFile}
        onCreateFile={async (name, path, isFolder, language, content) => {
          return await createFile(name, path, isFolder, language, content);
        }}
        onUpdateFileContent={(fileId, content) => {
          updateFileContent(fileId, content);
          setLocalContent(content);
        }}
      />
    </div>
  );
};

export default Room;
