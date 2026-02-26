import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Loader2, Sparkles } from "lucide-react";

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
      toast({ title: "Error", description: "Please enter email and password", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast({ title: "Signed in successfully!" });
        resetForm();
        onClose();
      } else {
        if (!displayName.trim()) {
          toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await signUpWithEmail(email, password, displayName);
        if (error) throw error;
        toast({ title: "Registered successfully!", description: "You can now sign in" });
        resetForm();
        onClose();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = error.message;
      if (error.message?.includes("Invalid login credentials")) errorMessage = "Invalid email or password";
      else if (error.message?.includes("User already registered")) errorMessage = "A user with this email is already registered";
      else if (error.message?.includes("Password should be")) errorMessage = "Password must be at least 6 characters";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
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
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-md rounded-2xl p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="h-1 w-full bg-gradient-tokyo" />
        
        <div className="p-6 pt-5">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <DialogTitle className="font-space text-xl text-center font-bold tracking-tight">
              {mode === "login" ? "Sign In" : "Sign Up"}
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50 h-11 rounded-xl"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 h-11 rounded-xl"
                  required
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password (at least 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 h-11 rounded-xl"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl font-medium shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-2">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button type="button" onClick={switchMode} className="text-primary hover:underline font-medium" disabled={loading}>
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={switchMode} className="text-primary hover:underline font-medium" disabled={loading}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
