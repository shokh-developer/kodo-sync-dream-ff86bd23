import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createRoom } from "@/hooks/useFiles";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import { Code, Users, ArrowRight, Plus, LogIn, Terminal, User, LogOut, Settings, Layers, Globe, Sparkles, Braces } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
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
      toast({ title: "Room name required", description: "Please enter a room name", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const room = await createRoom(roomName);
      if (room?.id) navigate(`/room/${room.id}`);
      else throw new Error("Room was not created");
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "An error occurred", variant: "destructive" });
    } finally { setIsCreating(false); }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast({ title: "Room ID required", description: "Please enter a room ID", variant: "destructive" });
      return;
    }
    let roomId = joinRoomId.trim();
    if (roomId.includes("/room/")) roomId = roomId.split("/room/").pop() || roomId;
    navigate(`/room/${roomId}`);
  };

  const handleSignOut = async () => { await signOut(); toast({ title: "Signed out" }); };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const features = [
    { icon: Layers, title: "10+ Languages", description: "C++, Python, JavaScript, Java, Go, Rust, TypeScript and more" },
    { icon: Users, title: "Real-time Collaboration", description: "Code together with teammates in the same workspace" },
    { icon: Terminal, title: "Run & Preview", description: "Execute code and preview web pages directly in browser" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center glow-sm">
              <Braces className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-tight">CodeForge</span>
          </div>

          {loading ? (
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary/80 transition-all duration-200">
                  <Avatar className="h-7 w-7 ring-1 ring-border">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {getInitials(profile?.display_name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground hidden sm:inline font-medium">
                    {profile?.display_name || user?.email?.split("@")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-rooms")} className="cursor-pointer gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" /> My Rooms
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer gap-2">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => setShowAuthModal(true)} className="h-8 text-xs gap-1.5">
              <User className="h-3.5 w-3.5" /> Sign in
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 relative z-10">
        <motion.header
          className="text-center mb-16"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3 w-3" />
              Real-time Collaborative IDE
            </div>
          </motion.div>
          <motion.h1 variants={item} className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-5">
            <span className="text-primary">Code</span>
            <span className="text-foreground">Forge</span>
          </motion.h1>
          <motion.p variants={item} className="text-sm text-muted-foreground mb-2 font-medium">
            by <span className="text-primary">shokh</span>
          </motion.p>
          <motion.p variants={item} className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Write, run, and collaborate on code in real time.
            <br className="hidden sm:block" />
            C++, Python, JavaScript, and 10+ languages.
          </motion.p>
        </motion.header>

        {/* Action Cards */}
        <motion.div
          className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-20"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="glass-card-hover rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">New Room</h2>
                <p className="text-xs text-muted-foreground">Start a coding session</p>
              </div>
            </div>
            <Input
              placeholder="Room name..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="h-10 text-sm bg-background/50"
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
            />
            <Button className="w-full h-10 text-sm font-medium gap-1.5" onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Room"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>

          <motion.div variants={item} className="glass-card-hover rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <LogIn className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Join Room</h2>
                <p className="text-xs text-muted-foreground">Connect to existing room</p>
              </div>
            </div>
            <Input
              placeholder="Room ID or link..."
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="h-10 text-sm bg-background/50"
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <Button variant="secondary" className="w-full h-10 text-sm font-medium gap-1.5" onClick={handleJoinRoom}>
              Join <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={item} className="glass-card rounded-xl p-6 text-center group">
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:glow-sm transition-shadow duration-300">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Languages */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.2em] font-medium">Supported languages</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {["C++", "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "PHP", "Ruby", "C#", "C"].map((lang) => (
              <span
                key={lang}
                className="px-3 py-1.5 text-[11px] font-jetbrains rounded-lg bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-default"
              >
                {lang}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Braces className="h-3.5 w-3.5 text-primary/60" />
            <span className="font-bold text-foreground/60 text-xs">CodeForge</span>
          </div>
          <p className="text-muted-foreground text-[11px]">
            by <span className="text-primary/70 font-medium">shokh</span> — Real-time collaborative coding platform
          </p>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
