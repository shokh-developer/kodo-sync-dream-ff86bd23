import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Users,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceChatProps {
  roomId: string;
}

const VoiceChat = ({ roomId }: VoiceChatProps) => {
  const { isAuthenticated, profile } = useAuth();
  const {
    isConnected,
    isMuted,
    peers,
    activeParticipants,
    joinVoice,
    leaveVoice,
    toggleMute,
  } = useVoiceChat(roomId);

  const [isJoining, setIsJoining] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Play peer audio streams
  useEffect(() => {
    peers.forEach((peer) => {
      if (peer.stream) {
        let audio = audioRefs.current.get(peer.odaara);
        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          (audio as any).playsInline = true;
          audio.volume = 1.0;
          // Append to DOM to ensure playback works
          audio.style.display = 'none';
          document.body.appendChild(audio);
          audioRefs.current.set(peer.odaara, audio);
          console.log(`Created audio element for peer ${peer.odaara}`);
        }
        if (audio.srcObject !== peer.stream) {
          audio.srcObject = peer.stream;
          console.log(`Set audio stream for peer ${peer.odaara}, tracks:`, peer.stream.getAudioTracks().length);
          
          // Force play with user gesture handling
          audio.play().catch((e) => {
            console.error(`Audio play failed for ${peer.odaara}:`, e);
            // Try again on user interaction
            const playOnInteraction = () => {
              audio?.play().catch(console.error);
              document.removeEventListener('click', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction, { once: true });
          });
        }
      }
    });

    // Cleanup removed peers
    audioRefs.current.forEach((audio, odaaraId) => {
      if (!peers.find((p) => p.odaara === odaaraId)) {
        audio.srcObject = null;
        audio.remove();
        audioRefs.current.delete(odaaraId);
        console.log(`Removed audio element for peer ${odaaraId}`);
      }
    });
  }, [peers]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinVoice();
      toast.success("Ovozli chatga qo'shildingiz");
    } catch (error: any) {
      console.error("Failed to join voice:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Mikrofon ruxsati berilmadi");
      } else {
        toast.error("Ovozli chatga ulanib bo'lmadi");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    leaveVoice();
    toast.info("Ovozli chatdan chiqdingiz");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden w-64"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Ovozli Chat</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeParticipants.length} kishi
                </span>
              </div>
            </div>

            {/* Participants */}
            <div className="p-3 max-h-48 overflow-y-auto">
              {isConnected ? (
                <>
                  {/* Self */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {getInitials(profile?.display_name || "Siz")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 truncate">
                      {profile?.display_name || "Siz"}
                    </span>
                    {isMuted ? (
                      <MicOff className="h-4 w-4 text-destructive" />
                    ) : (
                      <Mic className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Other participants */}
                  {peers.map((peer) => (
                    <div
                      key={peer.odaara}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-secondary/20 text-secondary-foreground">
                          {getInitials(peer.odaaraName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1 truncate">
                        {peer.odaaraName}
                      </span>
                      <Volume2 className="h-4 w-4 text-primary" />
                    </div>
                  ))}

                  {peers.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Hozircha faqat siz borsiz
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Qo'shilish uchun tugmani bosing
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-3 border-t border-border bg-muted/20">
              {isConnected ? (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMute}
                    className={cn(
                      "h-9 w-9 p-0",
                      isMuted && "bg-destructive/10 border-destructive/50"
                    )}
                  >
                    {isMuted ? (
                      <MicOff className="h-4 w-4 text-destructive" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLeave}
                    className="h-9 px-4"
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Chiqish
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full h-9 bg-primary hover:bg-primary/90"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ulanmoqda...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Qo'shilish
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "p-3 rounded-full shadow-lg transition-colors relative",
          isConnected
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-card border border-border text-foreground hover:bg-muted"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isConnected ? (
          isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
        
        {/* Active indicator */}
        {isConnected && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
        )}
        
        {/* Participant count */}
        {activeParticipants.length > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {activeParticipants.length}
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default VoiceChat;
