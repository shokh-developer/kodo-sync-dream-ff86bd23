import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface RoomChatProps {
  roomId: string;
}

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

  // Fetch messages
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select(`
          *,
          profile:profiles!chat_messages_user_id_fkey(display_name, avatar_url)
        `)
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data.map(msg => ({
          ...msg,
          profile: Array.isArray(msg.profile) ? msg.profile[0] : msg.profile
        })));
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch profile for new message
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", payload.new.user_id)
            .single();

          const newMsg: Message = {
            ...(payload.new as any),
            profile: profileData,
          };
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Check mute status
  useEffect(() => {
    if (!user?.id || !roomId) return;

    const checkMute = async () => {
      const muted = await isUserMuted(user.id, roomId);
      setMutedByAdmin(muted);
    };

    checkMute();

    const channel = supabase
      .channel(`chat-mute:${roomId}:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_bans",
          filter: `user_id=eq.${user.id}`,
        },
        checkMute
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user?.id, isUserMuted]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    if (mutedByAdmin) {
      toast({
        title: "Chat disabled",
        description: "You are muted in this room.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await supabase.from("chat_messages").insert({
        room_id: roomId,
        user_id: user.id,
        content: newMessage.trim(),
      });
      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = messages.length > 0 && !isOpen ? messages.length : 0;

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        className={cn(
          "fixed bottom-4 right-[68px] z-[70] h-12 w-12 rounded-xl shadow-lg transition-all duration-200",
          "flex items-center justify-center backdrop-blur-sm relative",
          isOpen
            ? "bg-secondary/20 text-secondary border border-secondary/50"
            : "bg-card/90 text-foreground border border-border hover:border-secondary/50 hover:bg-card"
        )}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-[68px] z-[70] w-80 h-96 bg-card border border-border rounded-xl shadow-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Room Chat</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-xs">Be the first to send one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex gap-2",
                          isOwn && "flex-row-reverse"
                        )}
                      >
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarImage src={msg.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {getInitials(msg.profile?.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-lg px-3 py-2",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {msg.profile?.display_name || "Anonymous"}
                            </p>
                          )}
                          <p className="text-sm break-words">{msg.content}</p>
                          <p
                            className={cn(
                              "text-[10px] mt-1",
                              isOwn ? "opacity-70" : "text-muted-foreground"
                            )}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            {isAuthenticated ? (
              <div className="p-3 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={mutedByAdmin ? "You are muted by admin" : "Type a message..."}
                    className="flex-1 h-9 text-sm bg-background border-border"
                    disabled={sending || mutedByAdmin}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 px-3 bg-primary text-primary-foreground"
                    disabled={!newMessage.trim() || sending || mutedByAdmin}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {mutedByAdmin && (
                  <p className="text-xs text-destructive mt-2">You are muted and cannot send messages.</p>
                )}
              </div>
            ) : (
              <div className="p-3 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Sign in to use chat
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoomChat;
