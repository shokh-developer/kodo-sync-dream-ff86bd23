import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Code, Users, Zap, ArrowRight, Plus, LogIn, Terminal, User, LogOut, Settings, Layers, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    } finally {
      setIsCreating(false);
    }
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

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const features = [
    { icon: Layers, title: "10+ Languages", description: "C++, Python, JavaScript, Java, Go, Rust, TypeScript and more" },
    { icon: Users, title: "Real-time Collaboration", description: "Code together with your teammates in the same workspace" },
    { icon: Terminal, title: "Run Code", description: "Execute code directly in the browser with instant feedback" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
              <Code className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground text-sm tracking-tight">CodeForge</span>
          </div>

          {loading ? (
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors duration-150">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                      {getInitials(profile?.display_name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground hidden sm:inline">
                    {profile?.display_name || user?.email?.split("@")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-rooms")} className="cursor-pointer">
                  <Code className="h-4 w-4 mr-2 text-muted-foreground" /> My Rooms
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2 text-muted-foreground" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => setShowAuthModal(true)} className="h-8 text-xs">
              <User className="h-3.5 w-3.5 mr-1.5" /> Sign in
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <header className="text-center mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
            <Globe className="h-3 w-3" />
            Real-time Collaborative IDE
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-primary">Code</span>
            <span className="text-foreground">Forge</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-1.5 font-medium">
            by <span className="text-primary">shokh</span>
          </p>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Write, run, and collaborate on code in real time.
            C++, Python, JavaScript, and 10+ languages.
          </p>
        </header>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">New Room</h2>
                <p className="text-xs text-muted-foreground">Start a coding session</p>
              </div>
            </div>
            <Input
              placeholder="Room name..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
            />
            <Button className="w-full h-9 text-sm" onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Room"}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <LogIn className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Join Room</h2>
                <p className="text-xs text-muted-foreground">Connect to existing room</p>
              </div>
            </div>
            <Input
              placeholder="Room ID or link..."
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <Button variant="secondary" className="w-full h-9 text-sm" onClick={handleJoinRoom}>
              Join <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-14">
          {features.map((feature, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 text-center">
              <div className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-primary/10 mb-3">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-widest font-medium">Supported languages</p>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto">
            {["C++", "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "PHP", "Ruby", "C#", "C"].map((lang) => (
              <span
                key={lang}
                className="px-2.5 py-1 text-[11px] font-jetbrains rounded-md bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-primary/30 transition-colors duration-150 cursor-default"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Code className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground/70 text-xs">CodeForge</span>
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
