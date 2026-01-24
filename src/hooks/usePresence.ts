import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  onlineUsers: number;
  userIds: string[];
}

export const usePresence = (roomId: string | null) => {
  const [presence, setPresence] = useState<PresenceState>({
    onlineUsers: 0,
    userIds: [],
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Generate a unique user ID for this session
    const sessionUserId = `user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    const presenceChannel = supabase.channel(`room_presence:${roomId}`, {
      config: {
        presence: {
          key: sessionUserId,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const userIds = Object.keys(state);
        setPresence({
          onlineUsers: userIds.length,
          userIds,
        });
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            user_id: sessionUserId,
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        presenceChannel.untrack();
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [roomId]);

  return presence;
};
