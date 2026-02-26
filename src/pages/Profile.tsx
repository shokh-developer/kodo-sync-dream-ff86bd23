import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MangaButton } from "@/components/MangaButton";
import { MangaCard } from "@/components/MangaCard";
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Xatolik",
        description: "Faqat rasm fayllari qabul qilinadi",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Xatolik",
        description: "Rasm hajmi 2MB dan oshmasligi kerak",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithCacheBuster);

      toast({
        title: "Muvaffaqiyat",
        description: "Avatar yuklandi. Saqlash tugmasini bosing",
      });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Avatar yuklashda xatolik",
        variant: "destructive",
      });
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
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat",
        description: "Profil yangilandi",
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Profil yangilashda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-night flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-night speed-lines">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <MangaButton
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </MangaButton>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MangaCard glowColor="pink" className="p-8">
            <h1 className="text-2xl font-jetbrains font-bold text-foreground mb-8 flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              Profil Sozlamalari
            </h1>

            <div className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-primary/30">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                      {getInitials(displayName || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Avatarni o'zgartirish uchun ustiga bosing
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-foreground">
                  Ko'rsatiladigan ism
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ismingizni kiriting..."
                  className="bg-background border-border"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label className="text-foreground">Email</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted border-border text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Email o'zgartirib bo'lmaydi
                </p>
              </div>

              {/* Save Button */}
              <MangaButton
                variant="primary"
                className="w-full"
                onClick={handleSave}
                disabled={isSaving}
              >
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
          </MangaCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
