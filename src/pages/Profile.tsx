import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MangaButton } from "@/components/MangaButton";
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Xatolik", description: "Faqat rasm fayllari qabul qilinadi", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Xatolik", description: "Rasm hajmi 2MB dan oshmasligi kerak", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithCacheBuster);
      toast({ title: "Muvaffaqiyat", description: "Avatar yuklandi. Saqlash tugmasini bosing" });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({ title: "Xatolik", description: error.message || "Avatar yuklashda xatolik", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Muvaffaqiyat", description: "Profil yangilandi" });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ title: "Xatolik", description: error.message || "Profil yangilashda xatolik", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 bg-gradient-night pointer-events-none" />
      <div className="fixed top-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 py-10 max-w-lg relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <MangaButton variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </MangaButton>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          className="glass-card rounded-2xl p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="text-xl font-space font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Profil Sozlamalari
          </h1>

          <div className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Avatar className="h-28 w-28 border-2 border-border/50">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-space">
                    {getInitials(displayName || user?.email)}
                  </AvatarFallback>
                </Avatar>
                
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                  ) : (
                    <Camera className="h-6 w-6 text-foreground" />
                  )}
                </button>
                
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </motion.div>
              
              <p className="text-xs text-muted-foreground">
                Avatarni o'zgartirish uchun ustiga bosing
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground text-sm font-medium">
                Ko'rsatiladigan ism
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ismingizni kiriting..."
                className="bg-background/50 border-border/50 h-11 rounded-xl"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted/30 border-border/50 text-muted-foreground h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Email o'zgartirib bo'lmaydi
              </p>
            </div>

            {/* Save Button */}
            <MangaButton variant="primary" className="w-full" size="lg" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Saqlash
                </>
              )}
            </MangaButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
