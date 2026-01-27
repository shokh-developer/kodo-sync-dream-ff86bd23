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
import { Code, Users, Zap, ArrowRight, Plus, LogIn, Flame, Terminal, User, LogOut } from "lucide-react";
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
      toast({
        title: "Xona nomi kerak",
        description: "Iltimos, xona nomini kiriting",
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
        throw new Error("Xona yaratilmadi");
      }
    } catch (error: any) {
      console.error("Room creation error:", error);
      toast({
        title: "Xatolik",
        description: error?.message || "Xona yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast({
        title: "Xona ID kerak",
        description: "Iltimos, xona ID sini kiriting",
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
    toast({ title: "Chiqib ketdingiz" });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const features = [
    {
      icon: Code,
      title: "10+ Tillar",
      description: "C++, Python, JavaScript, Java, Go, Rust, TypeScript va boshqalar",
      color: "pink" as const,
    },
    {
      icon: Users,
      title: "Real-time Hamkorlik",
      description: "Do'stlaringiz bilan bir xil kodda ishlang",
      color: "blue" as const,
    },
    {
      icon: Terminal,
      title: "Kod Ishga Tushirish",
      description: "Kodni to'g'ridan-to'g'ri brauzerda run qiling",
      color: "green" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-night speed-lines">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-jetbrains font-bold text-foreground">CodeForge</span>
          </div>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {getInitials(profile?.display_name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground hidden sm:inline">
                    {profile?.display_name || user?.email?.split("@")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuItem onClick={() => navigate("/profile")} className="text-foreground cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <MangaButton
              variant="primary"
              size="sm"
              onClick={() => setShowAuthModal(true)}
            >
              <User className="h-4 w-4" />
              Kirish
            </MangaButton>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 lg:py-20 pt-24">
        {/* Header */}
        <motion.header
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Flame className="h-12 w-12 md:h-16 md:w-16 text-primary" />
            </motion.div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-jetbrains font-bold">
              <span className="text-gradient-tokyo">CODE</span>
              <span className="text-foreground">FORGE</span>
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground mb-2">
            by <span className="text-primary font-semibold">shokh</span>
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Do'stlaringiz bilan real-time rejimda kod yozing va ishga tushiring. 
            <br className="hidden md:block" />
            C++, Python, JavaScript va 10+ til!
          </p>
        </motion.header>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {/* Create Room Card */}
          <MangaCard glowColor="pink">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-jetbrains font-bold text-foreground">
                  Yangi Xona
                </h2>
              </div>
              
              <p className="text-muted-foreground">
                Yangi coding xonasi yarating va do'stlaringizni taklif qiling
              </p>
              
              <Input
                placeholder="Xona nomi..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
              />
              
              <MangaButton
                variant="primary"
                className="w-full"
                onClick={handleCreateRoom}
                disabled={isCreating}
              >
                {isCreating ? "Yaratilmoqda..." : "Xona Yaratish"}
                <ArrowRight className="h-4 w-4" />
              </MangaButton>
            </div>
          </MangaCard>

          {/* Join Room Card */}
          <MangaCard glowColor="blue">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/20">
                  <LogIn className="h-6 w-6 text-secondary" />
                </div>
                <h2 className="text-xl font-jetbrains font-bold text-foreground">
                  Xonaga Qo'shilish
                </h2>
              </div>
              
              <p className="text-muted-foreground">
                Mavjud xonaga xona ID yoki link orqali qo'shiling
              </p>
              
              <Input
                placeholder="Xona ID yoki to'liq link..."
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              
              <MangaButton
                variant="secondary"
                className="w-full"
                onClick={handleJoinRoom}
              >
                Qo'shilish
                <ArrowRight className="h-4 w-4" />
              </MangaButton>
            </div>
          </MangaCard>
        </div>

        {/* Features */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {features.map((feature, index) => (
            <MangaCard key={index} glowColor={feature.color} className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                className="inline-flex p-4 rounded-xl bg-gradient-tokyo mb-4"
              >
                <feature.icon className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <h3 className="text-lg font-jetbrains font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </MangaCard>
          ))}
        </motion.div>

        {/* Supported Languages */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Qo'llab-quvvatlanadigan tillar:
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {["C++", "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "PHP", "Ruby", "C#", "C"].map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 text-xs font-mono rounded-full bg-muted/50 text-muted-foreground border border-border hover:border-primary hover:text-primary transition-colors cursor-default"
              >
                {lang}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-jetbrains font-bold text-foreground">CodeForge</span>
          </div>
          <p className="text-muted-foreground text-sm">
            by <span className="text-primary font-semibold">shokh</span> — 
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
