import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  code: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export const useRoom = (roomId: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isLocalChange = useRef(false);

  // Fetch room data
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const fetchRoom = async () => {
      setLoading(true);
      setError(null);

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

  // Subscribe to realtime changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          // Only update if it's not from our own change
          if (!isLocalChange.current) {
            setRoom(payload.new as Room);
          }
          isLocalChange.current = false;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Update code
  const updateCode = useCallback(
    async (newCode: string) => {
      if (!roomId || !room) return;

      isLocalChange.current = true;
      setRoom((prev) => (prev ? { ...prev, code: newCode } : null));

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ code: newCode })
        .eq("id", roomId);

      if (updateError) {
        toast({
          title: "Xatolik",
          description: "Kodni saqlashda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    },
    [roomId, room, toast]
  );

  // Update language
  const updateLanguage = useCallback(
    async (newLanguage: string) => {
      if (!roomId || !room) return;

      isLocalChange.current = true;
      setRoom((prev) => (prev ? { ...prev, language: newLanguage } : null));

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ language: newLanguage })
        .eq("id", roomId);

      if (updateError) {
        toast({
          title: "Xatolik",
          description: "Tilni o'zgartirishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    },
    [roomId, room, toast]
  );

  return {
    room,
    loading,
    error,
    updateCode,
    updateLanguage,
  };
};

export const createRoom = async (name: string) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert([
      {
        name,
        code: `// ${name}\n// Real-time hamkorlik bilan kod yozing!\n\nconsole.log("Salom, dunyo!");`,
        language: "javascript",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};
