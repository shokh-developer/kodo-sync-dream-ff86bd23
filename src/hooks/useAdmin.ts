import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "admin" | "moderator" | "user";

interface UserBan {
  id: string;
  user_id: string;
  room_id: string | null;
  banned_by: string;
  ban_type: "ban" | "kick" | "mute";
  reason: string | null;
  expires_at: string | null;
  created_at: string;
}

interface UserWithRole {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes("admin"));
      setIsModerator(roles.includes("moderator") || roles.includes("admin"));
      setLoading(false);
    };

    checkRole();
  }, [user]);

  const getAllUsers = async (): Promise<UserWithRole[]> => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url");

    const { data: roles } = await supabase.from("user_roles").select("*");

    return (profiles || []).map(profile => ({
      ...profile,
      role: (roles?.find(r => r.user_id === profile.user_id)?.role as AppRole) || "user",
    }));
  };

  const banUser = async (
    userId: string,
    banType: "ban" | "kick" | "mute",
    roomId?: string,
    reason?: string,
    expiresAt?: Date
  ) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase.from("user_bans").insert({
      user_id: userId,
      room_id: roomId || null,
      banned_by: user.id,
      ban_type: banType,
      reason: reason || null,
      expires_at: expiresAt?.toISOString() || null,
    });

    return { error };
  };

  const unbanUser = async (banId: string) => {
    const { error } = await supabase.from("user_bans").delete().eq("id", banId);
    return { error };
  };

  const getBans = async (roomId?: string): Promise<UserBan[]> => {
    let query = supabase.from("user_bans").select("*");
    if (roomId) {
      query = query.eq("room_id", roomId);
    }
    const { data } = await query;
    return (data || []) as UserBan[];
  };

  const setUserRole = async (userId: string, role: AppRole) => {
    // First delete existing role
    await supabase.from("user_roles").delete().eq("user_id", userId);
    
    // Then insert new role
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: role,
    });
    return { error };
  };

  const hasActiveBanType = async (
    userId: string,
    banType: "ban" | "mute" | "kick",
    roomId?: string
  ): Promise<boolean> => {
    let query = supabase
      .from("user_bans")
      .select("room_id, expires_at")
      .eq("user_id", userId)
      .eq("ban_type", banType);

    if (roomId) {
      query = query.or(`room_id.eq.${roomId},room_id.is.null`);
    } else {
      query = query.is("room_id", null);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return false;

    const now = new Date();
    return data.some((ban) => !ban.expires_at || new Date(ban.expires_at) > now);
  };

  const isUserBanned = async (userId: string, roomId?: string): Promise<boolean> => {
    return hasActiveBanType(userId, "ban", roomId);
  };

  const isUserMuted = async (userId: string, roomId?: string): Promise<boolean> => {
    return hasActiveBanType(userId, "mute", roomId);
  };

  const isUserKicked = async (userId: string, roomId?: string): Promise<boolean> => {
    return hasActiveBanType(userId, "kick", roomId);
  };

  return {
    isAdmin,
    isModerator,
    loading,
    getAllUsers,
    banUser,
    unbanUser,
    getBans,
    setUserRole,
    isUserBanned,
    isUserMuted,
    isUserKicked,
  };
};
