import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  id: string;
  room_id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  is_folder: boolean;
  created_at: string;
  updated_at: string;
}

interface Room {
  id: string;
  name: string;
  code: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export const useFiles = (roomId: string | null) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isLocalChange = useRef(false);

  // Fetch files
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const fetchFiles = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("room_id", roomId)
        .order("is_folder", { ascending: false })
        .order("name");

      if (error) {
        toast({
          title: "Xatolik",
          description: "Fayllarni yuklashda xatolik",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // If no files, create default file
      if (!data || data.length === 0) {
        const defaultFile = await createFile(roomId, "main.js", "/", false, "javascript", '// Welcome to MangaCode!\nconsole.log("Hello, World!");');
        if (defaultFile) {
          setFiles([defaultFile]);
          setActiveFile(defaultFile);
        }
      } else {
        setFiles(data);
        // Set first non-folder file as active
        const firstFile = data.find(f => !f.is_folder);
        if (firstFile) setActiveFile(firstFile);
      }
      
      setLoading(false);
    };

    fetchFiles();
  }, [roomId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`files-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "files",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (isLocalChange.current) {
            isLocalChange.current = false;
            return;
          }

          if (payload.eventType === "INSERT") {
            setFiles(prev => [...prev, payload.new as FileItem]);
          } else if (payload.eventType === "UPDATE") {
            setFiles(prev => prev.map(f => f.id === payload.new.id ? payload.new as FileItem : f));
            setActiveFile(prev => prev?.id === payload.new.id ? payload.new as FileItem : prev);
          } else if (payload.eventType === "DELETE") {
            setFiles(prev => prev.filter(f => f.id !== payload.old.id));
            setActiveFile(prev => prev?.id === payload.old.id ? null : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Create file
  const createFile = async (
    roomId: string,
    name: string,
    path: string,
    isFolder: boolean,
    language: string = "javascript",
    content: string = ""
  ): Promise<FileItem | null> => {
    const { data, error } = await supabase
      .from("files")
      .insert([{ room_id: roomId, name, path, is_folder: isFolder, language, content }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    isLocalChange.current = true;
    setFiles(prev => [...prev, data]);
    return data;
  };

  // Update file content
  const updateFileContent = useCallback(
    async (fileId: string, newContent: string) => {
      isLocalChange.current = true;
      
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content: newContent } : f));
      setActiveFile(prev => prev?.id === fileId ? { ...prev, content: newContent } : prev);

      const { error } = await supabase
        .from("files")
        .update({ content: newContent })
        .eq("id", fileId);

      if (error) {
        toast({
          title: "Xatolik",
          description: "Faylni saqlashda xatolik",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Delete file
  const deleteFile = async (fileId: string) => {
    isLocalChange.current = true;

    const { error } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (error) {
      toast({
        title: "Xatolik",
        description: "Faylni o'chirishda xatolik",
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFile?.id === fileId) {
      const remaining = files.filter(f => f.id !== fileId && !f.is_folder);
      setActiveFile(remaining[0] || null);
    }
  };

  // Rename file
  const renameFile = async (fileId: string, newName: string) => {
    isLocalChange.current = true;

    const { error } = await supabase
      .from("files")
      .update({ name: newName })
      .eq("id", fileId);

    if (error) {
      toast({
        title: "Xatolik",
        description: "Fayl nomini o'zgartirishda xatolik",
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
  };

  return {
    files,
    activeFile,
    setActiveFile,
    loading,
    createFile: (name: string, path: string, isFolder: boolean, language?: string, content?: string) => 
      roomId ? createFile(roomId, name, path, isFolder, language, content) : Promise.resolve(null),
    updateFileContent,
    deleteFile,
    renameFile,
  };
};

export const useRoom = (roomId: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const fetchRoom = async () => {
      const { data, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (fetchError) {
        setError("Xona topilmadi");
        setLoading(false);
        return;
      }

      setRoom(data);
      setLoading(false);
    };

    fetchRoom();
  }, [roomId]);

  return { room, loading, error };
};

export const createRoom = async (name: string) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert([{ name, code: "", language: "javascript" }])
    .select()
    .single();

  if (error) throw error;
  return data;
};
