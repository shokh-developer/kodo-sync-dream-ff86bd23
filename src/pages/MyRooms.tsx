import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MangaButton } from "@/components/MangaButton";
import { MangaCard } from "@/components/MangaCard";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Clock, 
  Trash2, 
  ExternalLink,
  Loader2,
  FolderOpen,
  Crown
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch rooms created by user
      const { data: created, error: createdError } = await supabase
        .from("rooms")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (createdError) throw createdError;
      setCreatedRooms(created || []);

      // Fetch rooms user has joined (but not created)
      const { data: memberships, error: memberError } = await supabase
        .from("room_members")
        .select(`
          room_id,
          joined_at,
          rooms (*)
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (memberError) throw memberError;
      
      // Filter out rooms that user created (to avoid duplicates)
      const joinedOnly = (memberships || []).filter(
        (m: any) => m.rooms && m.rooms.created_by !== user.id
      ) as RoomMembership[];
      
      setJoinedRooms(joinedOnly);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Xatolik",
        description: "Xonalarni yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", deleteRoomId);

      if (error) throw error;

      setCreatedRooms(prev => prev.filter(r => r.id !== deleteRoomId));
      toast({
        title: "Muvaffaqiyat",
        description: "Xona o'chirildi",
      });
    } catch (error: any) {
      console.error("Error deleting room:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Xonani o'chirishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteRoomId(null);
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      if (error) throw error;

      setJoinedRooms(prev => prev.filter(r => r.room_id !== roomId));
      toast({
        title: "Muvaffaqiyat",
        description: "Xonadan chiqib ketdingiz",
      });
    } catch (error: any) {
      console.error("Error leaving room:", error);
      toast({
        title: "Xatolik",
        description: "Xonadan chiqishda xatolik",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-night flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-night speed-lines">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <MangaButton
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </MangaButton>

          <MangaButton
            variant="primary"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Yangi xona
          </MangaButton>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-jetbrains font-bold text-foreground mb-8 flex items-center gap-3"
        >
          <FolderOpen className="h-8 w-8 text-primary" />
          Mening Xonalarim
        </motion.h1>

        {/* Created Rooms Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-xl font-jetbrains font-semibold text-foreground mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Yaratgan xonalarim ({createdRooms.length})
          </h2>

          {createdRooms.length === 0 ? (
            <MangaCard glowColor="pink" className="text-center py-8">
              <p className="text-muted-foreground">
                Siz hali xona yaratmagansiz
              </p>
              <MangaButton
                variant="primary"
                className="mt-4"
                onClick={() => navigate("/")}
              >
                <Plus className="h-4 w-4" />
                Xona yaratish
              </MangaButton>
            </MangaCard>
          ) : (
            <div className="grid gap-4">
              {createdRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <MangaCard glowColor="pink" className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-jetbrains font-semibold text-foreground">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(room.created_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-muted text-xs">
                          {room.language}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MangaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/room/${room.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ochish
                      </MangaButton>
                      <MangaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteRoomId(room.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </MangaButton>
                    </div>
                  </MangaCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Joined Rooms Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-jetbrains font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            Qo'shilgan xonalarim ({joinedRooms.length})
          </h2>

          {joinedRooms.length === 0 ? (
            <MangaCard glowColor="blue" className="text-center py-8">
              <p className="text-muted-foreground">
                Siz hali boshqa xonalarga qo'shilmagansiz
              </p>
            </MangaCard>
          ) : (
            <div className="grid gap-4">
              {joinedRooms.map((membership, index) => (
                <motion.div
                  key={membership.room_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <MangaCard glowColor="blue" className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-jetbrains font-semibold text-foreground">
                        {membership.rooms.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Qo'shilgan: {formatDate(membership.joined_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-muted text-xs">
                          {membership.rooms.language}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MangaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/room/${membership.room_id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ochish
                      </MangaButton>
                      <MangaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeaveRoom(membership.room_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </MangaButton>
                    </div>
                  </MangaCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Xonani o'chirish
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu xona va undagi barcha fayllar o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground">
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "O'chirish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyRooms;
