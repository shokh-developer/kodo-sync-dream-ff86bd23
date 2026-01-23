import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MangaButton } from "@/components/MangaButton";
import { MangaCard } from "@/components/MangaCard";
import { Input } from "@/components/ui/input";
import { createRoom } from "@/hooks/useRoom";
import { Code, Users, Zap, Sparkles, ArrowRight, Plus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      navigate(`/room/${room.id}`);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xona yaratishda xatolik yuz berdi",
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
    navigate(`/room/${joinRoomId}`);
  };

  const features = [
    {
      icon: Code,
      title: "Ko'p Tillar",
      description: "JavaScript, TypeScript, Python, HTML, CSS va boshqalar",
      color: "pink" as const,
    },
    {
      icon: Users,
      title: "Real-time Hamkorlik",
      description: "Do'stlaringiz bilan bir xil kodda ishlang",
      color: "blue" as const,
    },
    {
      icon: Zap,
      title: "Tezkor Sinxronizatsiya",
      description: "O'zgarishlar bir zumda ko'rinadi",
      color: "green" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-cyber speed-lines">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 lg:py-20">
        {/* Header */}
        <motion.header
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/50 mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary font-rajdhani">
              Real-time Collaborative Coding
            </span>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-orbitron font-bold mb-6">
            <span className="text-gradient-manga">MANGA</span>
            <br />
            <span className="text-foreground">CODE</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground font-rajdhani max-w-2xl mx-auto">
            Do'stlaringiz bilan real-time rejimda kod yozing. 
            Bir xil fayl, bir xil kod, bir xil vaqt!
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
                <h2 className="text-xl font-orbitron font-bold text-foreground">
                  Yangi Xona
                </h2>
              </div>
              
              <p className="text-muted-foreground font-rajdhani">
                Yangi coding xonasi yarating va do'stlaringizni taklif qiling
              </p>
              
              <Input
                placeholder="Xona nomi..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-cyber-dark border-border text-foreground placeholder:text-muted-foreground font-rajdhani"
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
                <h2 className="text-xl font-orbitron font-bold text-foreground">
                  Xonaga Qo'shilish
                </h2>
              </div>
              
              <p className="text-muted-foreground font-rajdhani">
                Mavjud xonaga xona ID orqali qo'shiling
              </p>
              
              <Input
                placeholder="Xona ID yoki link..."
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="bg-cyber-dark border-border text-foreground placeholder:text-muted-foreground font-rajdhani"
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
                className="inline-flex p-4 rounded-xl bg-gradient-manga mb-4"
              >
                <feature.icon className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <h3 className="text-lg font-orbitron font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground font-rajdhani">
                {feature.description}
              </p>
            </MangaCard>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground font-rajdhani">
            Powered by <span className="text-primary font-semibold">MangaCode</span> — 
            Real-time collaborative coding platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
