import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Users, Clock, Trash2, ExternalLink, Loader2, FolderOpen, Crown } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Room { id: string; name: string; language: string; created_at: string; created_by: string | null; }
interface RoomMembership { room_id: string; joined_at: string; rooms: Room; }

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const MyRooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [createdRooms, setCreatedRooms] = useState<Room[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<RoomMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { if (!authLoading && !isAuthenticated) navigate("/"); }, [authLoading, isAuthenticated, navigate]);
  useEffect(() => { if (user) fetchRooms(); }, [user]);

  const fetchRooms = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: created } = await supabase.from("rooms").select("*").eq("created_by", user.id).order("created_at", { ascending: false });
      setCreatedRooms(created || []);
      const { data: memberships } = await supabase.from("room_members").select(`room_id, joined_at, rooms (*)`).eq("user_id", user.id).order("joined_at", { ascending: false });
      setJoinedRooms((memberships || []).filter((m: any) => m.rooms && m.rooms.created_by !== user.id) as RoomMembership[]);
    } catch { toast({ title: "Error", description: "Failed to load rooms", variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", deleteRoomId);
      if (error) throw error;
      setCreatedRooms(prev => prev.filter(r => r.id !== deleteRoomId));
      toast({ title: "Room deleted" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setIsDeleting(false); setDeleteRoomId(null); }
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!user) return;
    try {
      await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", user.id);
      setJoinedRooms(prev => prev.filter(r => r.room_id !== roomId));
      toast({ title: "Left room" });
    } catch { toast({ title: "Error", description: "Failed to leave room", variant: "destructive" }); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (authLoading || isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const RoomItem = ({ room, onOpen, onDelete, joinDate }: any) => (
    <motion.div variants={item} className="glass-card-hover rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm truncate">{room.name}</h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {joinDate ? `Joined ${formatDate(joinDate)}` : formatDate(room.created_at)}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] uppercase tracking-wider font-medium">
            {room.language}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => onOpen(room.id)} className="h-8 gap-1.5 text-xs">
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Open</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(room.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/[0.03] blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button size="sm" onClick={() => navigate("/")} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> New room
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">My Rooms</h1>
        </motion.div>

        {/* Created */}
        <section className="mb-10">
          <h2 className="text-xs font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-[0.15em]">
            <Crown className="h-3.5 w-3.5 text-primary" /> Rooms I created ({createdRooms.length})
          </h2>
          {createdRooms.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">No rooms yet</p>
              <Button size="sm" onClick={() => navigate("/")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Create room</Button>
            </div>
          ) : (
            <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
              {createdRooms.map(room => <RoomItem key={room.id} room={room} onOpen={(id: string) => navigate(`/room/${id}`)} onDelete={(id: string) => setDeleteRoomId(id)} />)}
            </motion.div>
          )}
        </section>

        {/* Joined */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-[0.15em]">
            <Users className="h-3.5 w-3.5 text-muted-foreground" /> Rooms I joined ({joinedRooms.length})
          </h2>
          {joinedRooms.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No joined rooms</p>
            </div>
          ) : (
            <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
              {joinedRooms.map(m => <RoomItem key={m.room_id} room={m.rooms} joinDate={m.joined_at} onOpen={(id: string) => navigate(`/room/${id}`)} onDelete={(id: string) => handleLeaveRoom(id)} />)}
            </motion.div>
          )}
        </section>
      </div>

      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent className="glass-card rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room</AlertDialogTitle>
            <AlertDialogDescription>This room and all its files will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom} disabled={isDeleting} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyRooms;
