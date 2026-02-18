import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MangaButton } from "@/components/MangaButton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Plus, Users, Clock, Trash2, ExternalLink, Loader2, FolderOpen, Crown
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Room {
  id: string;
  name: string;
  language: string;
  created_at: string;
  created_by: string | null;
}

interface RoomMembership {
  room_id: string;
  joined_at: string;
  rooms: Room;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const MyRooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [createdRooms, setCreatedRooms] = useState<Room[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<RoomMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/");
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: created, error: createdError } = await supabase
        .from("rooms").select("*").eq("created_by", user.id).order("created_at", { ascending: false });
      if (createdError) throw createdError;
      setCreatedRooms(created || []);

      const { data: memberships, error: memberError } = await supabase
        .from("room_members").select(`room_id, joined_at, rooms (*)`).eq("user_id", user.id).order("joined_at", { ascending: false });
      if (memberError) throw memberError;
      
      const joinedOnly = (memberships || []).filter(
        (m: any) => m.rooms && m.rooms.created_by !== user.id
      ) as RoomMembership[];
      setJoinedRooms(joinedOnly);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast({ title: "Xatolik", description: "Xonalarni yuklashda xatolik", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", deleteRoomId);
      if (error) throw error;
      setCreatedRooms(prev => prev.filter(r => r.id !== deleteRoomId));
      toast({ title: "Muvaffaqiyat", description: "Xona o'chirildi" });
    } catch (error: any) {
      console.error("Error deleting room:", error);
      toast({ title: "Xatolik", description: error.message || "Xonani o'chirishda xatolik", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteRoomId(null);
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", user.id);
      if (error) throw error;
      setJoinedRooms(prev => prev.filter(r => r.room_id !== roomId));
      toast({ title: "Muvaffaqiyat", description: "Xonadan chiqib ketdingiz" });
    } catch (error: any) {
      console.error("Error leaving room:", error);
      toast({ title: "Xatolik", description: "Xonadan chiqishda xatolik", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "numeric" });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const RoomItem = ({ room, onOpen, onDelete, isCreator = false, joinDate }: any) => (
    <motion.div
      variants={item}
      className="glass-card rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-border transition-all"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-space font-semibold text-foreground text-sm truncate">
          {room.name}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {joinDate ? `Qo'shilgan: ${formatDate(joinDate)}` : formatDate(room.created_at)}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-muted/30 text-[10px] uppercase tracking-wider">
            {room.language}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <MangaButton variant="outline" size="sm" onClick={() => onOpen(room.id)}>
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ochish</span>
        </MangaButton>
        <MangaButton
          variant="ghost"
          size="icon"
          onClick={() => onDelete(room.id)}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </MangaButton>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 bg-gradient-night pointer-events-none" />
      <div className="fixed bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/[0.03] blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 py-10 max-w-3xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <MangaButton variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </MangaButton>
          <MangaButton variant="primary" size="sm" onClick={() => navigate("/")} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Yangi xona
          </MangaButton>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-space font-bold text-foreground tracking-tight">
            Mening Xonalarim
          </h1>
        </motion.div>

        {/* Created Rooms */}
        <motion.section className="mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Crown className="h-3.5 w-3.5 text-primary" />
            Yaratgan xonalarim ({createdRooms.length})
          </h2>

          {createdRooms.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">Siz hali xona yaratmagansiz</p>
              <MangaButton variant="primary" size="sm" onClick={() => navigate("/")}>
                <Plus className="h-3.5 w-3.5" />
                Xona yaratish
              </MangaButton>
            </div>
          ) : (
            <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
              {createdRooms.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  isCreator
                  onOpen={(id: string) => navigate(`/room/${id}`)}
                  onDelete={(id: string) => setDeleteRoomId(id)}
                />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* Joined Rooms */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Users className="h-3.5 w-3.5 text-secondary" />
            Qo'shilgan xonalarim ({joinedRooms.length})
          </h2>

          {joinedRooms.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Siz hali boshqa xonalarga qo'shilmagansiz
              </p>
            </div>
          ) : (
            <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
              {joinedRooms.map((membership) => (
                <RoomItem
                  key={membership.room_id}
                  room={membership.rooms}
                  joinDate={membership.joined_at}
                  onOpen={(id: string) => navigate(`/room/${id}`)}
                  onDelete={(id: string) => handleLeaveRoom(id)}
                />
              ))}
            </motion.div>
          )}
        </motion.section>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-space">Xonani o'chirish</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Bu xona va undagi barcha fayllar o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border/50 rounded-xl">
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground rounded-xl"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyRooms;
