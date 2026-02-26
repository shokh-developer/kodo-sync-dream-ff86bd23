import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MangaButton } from "@/components/MangaButton";
import { MangaCard } from "@/components/MangaCard";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createRoom } from "@/hooks/useFiles";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import { Code, Users, Zap, ArrowRight, Plus, LogIn, Terminal, User, LogOut, Settings, Sparkles, Layers, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Index = () => {
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, signOut, loading } = useAuth();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a room name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const room = await createRoom(roomName);
      if (room?.id) {
        navigate(`/room/${room.id}`);
      } else {
        throw new Error("Room was not created");
      }
    } catch (error: any) {
      console.error("Room creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "An error occurred while creating the room",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast({
        title: "Room ID required",
        description: "Please enter a room ID",
        variant: "destructive",
      });
      return;
    }
    
    let roomId = joinRoomId.trim();
    if (roomId.includes("/room/")) {
      roomId = roomId.split("/room/").pop() || roomId;
    }
    
    navigate(`/room/${roomId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const features = [
    {
      icon: Layers,
      title: "10+ Languages",
      description: "C++, Python, JavaScript, Java, Go, Rust, TypeScript and more",
      color: "pink" as const,
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Code together with your teammates in the same workspace",
      color: "blue" as const,
    },
    {
      icon: Terminal,
      title: "Run Code",
      description: "Run code directly in the browser",
      color: "green" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-night pointer-events-none" />
      
      {/* Ambient glow orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/[0.04] blur-[120px] pointer-events-none" />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-space font-bold text-foreground text-lg tracking-tight">
              CodeForge
            </span>
          </div>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
                      {getInitials(profile?.display_name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground hidden sm:inline font-medium">
                    {profile?.display_name || user?.email?.split("@")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl p-1.5">
                <DropdownMenuItem onClick={() => navigate("/profile")} className="text-foreground cursor-pointer rounded-lg px-3 py-2.5">
                  <User className="h-4 w-4 mr-2.5 text-muted-foreground" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-rooms")} className="text-foreground cursor-pointer rounded-lg px-3 py-2.5">
                  <Code className="h-4 w-4 mr-2.5 text-muted-foreground" />
                  My rooms
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="text-foreground cursor-pointer rounded-lg px-3 py-2.5">
                  <Settings className="h-4 w-4 mr-2.5 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5 bg-border/50" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer rounded-lg px-3 py-2.5">
                  <LogOut className="h-4 w-4 mr-2.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <MangaButton
              variant="primary"
              size="sm"
              onClick={() => setShowAuthModal(true)}
            >
              <User className="h-3.5 w-3.5" />
              Sign in
            </MangaButton>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Header */}
        <motion.header
          className="text-center mb-20"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide">
              <Globe className="h-3 w-3" />
              Real-time Collaborative IDE
            </span>
          </motion.div>

          <motion.h1 variants={item} className="text-5xl md:text-7xl lg:text-8xl font-space font-bold tracking-tight leading-[0.95] mb-6">
            <span className="text-gradient-tokyo">Code</span>
            <span className="text-foreground">Forge</span>
          </motion.h1>
          
          <motion.p variants={item} className="text-sm text-muted-foreground mb-4 font-medium">
            by <span className="text-primary">shokh</span>
          </motion.p>
          
          <motion.p variants={item} className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Write, run, and collaborate on code in real time with your team.
            C++, Python, JavaScript, and 10+ languages.
          </motion.p>
        </motion.header>

        {/* Action Cards */}
        <motion.div 
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-24"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Create Room Card */}
          <motion.div variants={item}>
            <MangaCard glowColor="pink" className="h-full">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-space font-bold text-foreground">
                      New Room
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Start a new coding session
                    </p>
                  </div>
                </div>
                
                <Input
                  placeholder="Room name..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                />
                
                <MangaButton
                  variant="primary"
                  className="w-full"
                  size="lg"
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Room"}
                  <ArrowRight className="h-4 w-4" />
                </MangaButton>
              </div>
            </MangaCard>
          </motion.div>

          {/* Join Room Card */}
          <motion.div variants={item}>
            <MangaCard glowColor="blue" className="h-full">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-space font-bold text-foreground">
                      Join Room
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Connect to an existing room
                    </p>
                  </div>
                </div>
                
                <Input
                  placeholder="Room ID or full link..."
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                />
                
                <MangaButton
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={handleJoinRoom}
                >
                  Join
                  <ArrowRight className="h-4 w-4" />
                </MangaButton>
              </div>
            </MangaCard>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-20"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <MangaCard glowColor={feature.color} className="text-center py-8">
                <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 mb-5">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-space font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </MangaCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Supported Languages */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest font-medium">
            Supported languages
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {["C++", "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "PHP", "Ruby", "C#", "C"].map((lang) => (
              <motion.span
                key={lang}
                className="px-3 py-1.5 text-xs font-jetbrains rounded-lg bg-muted/30 text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-300 cursor-default"
                whileHover={{ scale: 1.05 }}
              >
                {lang}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary/60" />
            <span className="font-space font-semibold text-foreground/80 text-sm">CodeForge</span>
          </div>
          <p className="text-muted-foreground text-xs">
            by <span className="text-primary/80 font-medium">shokh</span> -
            Real-time collaborative coding platform
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
