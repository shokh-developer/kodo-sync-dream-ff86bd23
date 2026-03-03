import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string; content: string; created_at: string; user_id: string;
  profile?: { display_name: string | null; avatar_url: string | null; };
}

interface RoomChatProps { roomId: string; }

const RoomChat = ({ roomId }: RoomChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mutedByAdmin, setMutedByAdmin] = useState(false);
  const { user, profile, isAuthenticated } = useAuth();
  const { isUserMuted } = useAdmin();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roomId) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("chat_messages")
        .select(`*`)
        .eq("room_id", roomId).order("created_at", { ascending: true }).limit(100);
      if (data) {
        // Fetch profiles for all unique user_ids
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase.from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setMessages(data.map(msg => ({ ...msg, profile: profileMap.get(msg.user_id) || null })));
      }
    };
    fetchMessages();
    const channel = supabase.channel(`chat:${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { data: profileData } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", payload.new.user_id).single();
          setMessages((prev) => [...prev, { ...(payload.new as any), profile: profileData }]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current && isOpen) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (!user?.id || !roomId) return;
    const checkMute = async () => setMutedByAdmin(await isUserMuted(user.id, roomId));
    checkMute();
    const channel = supabase.channel(`chat-mute:${roomId}:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_bans", filter: `user_id=eq.${user.id}` }, checkMute)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, user?.id, isUserMuted]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    if (mutedByAdmin) { toast({ title: "Muted", description: "You are muted in this room.", variant: "destructive" }); return; }
    setSending(true);
    try {
      await supabase.from("chat_messages").insert({ room_id: roomId, user_id: user.id, content: newMessage.trim() });
      setNewMessage(""); inputRef.current?.focus();
    } catch (error) { console.error("Error:", error); }
    finally { setSending(false); }
  };

  const getInitials = (name: string | null) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <button
        className={cn(
          "fixed bottom-3 right-14 z-[70] h-9 w-9 rounded-md shadow-md transition-colors duration-150 flex items-center justify-center",
          isOpen ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-14 right-14 z-[70] w-72 h-80 bg-card border border-border rounded-lg shadow-lg flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-xs">Chat</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-0.5 hover:bg-secondary rounded"><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>

            <ScrollArea className="flex-1 p-2" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
                  <MessageCircle className="h-6 w-6 mb-1.5 opacity-40" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex gap-1.5", isOwn && "flex-row-reverse")}>
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(msg.profile?.display_name)}</AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-[75%] rounded-md px-2.5 py-1.5", isOwn ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                          {!isOwn && <p className="text-[10px] font-medium mb-0.5 opacity-60">{msg.profile?.display_name || "Anonymous"}</p>}
                          <p className="text-xs break-words">{msg.content}</p>
                          <p className={cn("text-[9px] mt-0.5", isOwn ? "opacity-60" : "text-muted-foreground")}>{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {isAuthenticated ? (
              <div className="p-2 border-t border-border">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-1.5">
                  <Input ref={inputRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={mutedByAdmin ? "Muted" : "Message..."} className="flex-1 h-7 text-xs" disabled={sending || mutedByAdmin} />
                  <Button type="submit" size="sm" className="h-7 w-7 p-0" disabled={!newMessage.trim() || sending || mutedByAdmin}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
                {mutedByAdmin && <p className="text-[10px] text-destructive mt-1">You are muted.</p>}
              </div>
            ) : (
              <div className="p-2 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">Sign in to chat</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoomChat;
