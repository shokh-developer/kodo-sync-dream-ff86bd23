import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Xatolik",
        description: "Email va parolni kiriting",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Xatolik",
        description: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast({ title: "Muvaffaqiyatli kirdingiz!" });
        resetForm();
        onClose();
      } else {
        if (!displayName.trim()) {
          toast({
            title: "Xatolik",
            description: "Ismingizni kiriting",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const { error } = await signUpWithEmail(email, password, displayName);
        if (error) throw error;
        toast({ 
          title: "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
          description: "Endi tizimga kira olasiz",
        });
        resetForm();
        onClose();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = error.message;
      
      // Translate common errors
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email yoki parol noto'g'ri";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan";
      } else if (error.message?.includes("Password should be")) {
        errorMessage = "Parol kamida 6 ta belgidan iborat bo'lishi kerak";
      }
      
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-jetbrains text-xl text-center">
            {mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ismingiz"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 bg-background border-border"
                  disabled={loading}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background border-border"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Parol (kamida 6 ta belgi)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-background border-border"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                "Kirish"
              ) : (
                "Ro'yxatdan o'tish"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Akkountingiz yo'qmi?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Ro'yxatdan o'ting
                </button>
              </>
            ) : (
              <>
                Akkountingiz bormi?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Kiring
                </button>
              </>
            )}
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;