import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Loader2, Code } from "lucide-react";

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  const resetForm = () => { setEmail(""); setPassword(""); setDisplayName(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast({ title: "Error", description: "Please enter email and password", variant: "destructive" }); return; }
    if (password.length < 6) { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast({ title: "Signed in successfully!" }); resetForm(); onClose();
      } else {
        if (!displayName.trim()) { toast({ title: "Error", description: "Please enter your name", variant: "destructive" }); setLoading(false); return; }
        const { error } = await signUpWithEmail(email, password, displayName);
        if (error) throw error;
        toast({ title: "Registered!", description: "You can now sign in" }); resetForm(); onClose();
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg?.includes("Invalid login credentials")) msg = "Invalid email or password";
      else if (msg?.includes("User already registered")) msg = "Already registered";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-lg">
        <div className="h-0.5 w-full bg-primary" />
        <div className="p-5">
          <DialogHeader className="mb-5">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Code className="h-5 w-5 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-lg font-semibold">
              {mode === "login" ? "Sign In" : "Sign Up"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-9 h-9 text-sm" disabled={loading} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-9 text-sm" required disabled={loading} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-9 text-sm" required minLength={6} disabled={loading} />
            </div>
            <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {mode === "login" ? (
              <>Don't have an account? <button type="button" onClick={() => { setMode("register"); resetForm(); }} className="text-primary hover:underline font-medium" disabled={loading}>Sign up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => { setMode("login"); resetForm(); }} className="text-primary hover:underline font-medium" disabled={loading}>Sign in</button></>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
