import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Save, User, Loader2 } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!authLoading && !isAuthenticated) navigate("/"); }, [authLoading, isAuthenticated, navigate]);
  useEffect(() => { if (profile) { setDisplayName(profile.display_name || ""); setAvatarUrl(profile.avatar_url); } }, [profile]);

  const getInitials = (name: string | null | undefined) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Error", description: "Only image files are allowed", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Error", description: "Image must be 2MB or less", variant: "destructive" }); return; }
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
      toast({ title: "Uploaded", description: "Click Save to apply" });
    } catch (error: any) { toast({ title: "Error", description: error.message || "Upload failed", variant: "destructive" }); }
    finally { setIsUploading(false); }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({ display_name: displayName.trim() || null, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Profile updated" });
    } catch (error: any) { toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />
      </div>

      <div className="max-w-lg mx-auto px-6 py-10 relative z-10">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </motion.div>

        <motion.div
          className="glass-card rounded-xl p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Profile Settings
          </h1>

          <div className="space-y-8">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-2 ring-border">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(displayName || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-foreground" /> : <Camera className="h-6 w-6 text-foreground" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
              <p className="text-xs text-muted-foreground">Click avatar to change</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">Display name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name..." className="h-10 bg-background/50" />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input value={user?.email || ""} disabled className="h-10 bg-muted/30 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <Button className="w-full h-10 font-medium gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
