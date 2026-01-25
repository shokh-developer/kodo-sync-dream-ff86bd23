import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { MangaButton } from "./MangaButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Users,
  Ban,
  VolumeX,
  UserX,
  Crown,
  Trash2,
  Clock,
} from "lucide-react";

type AppRole = "admin" | "moderator" | "user";

interface User {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole;
}

interface Ban {
  id: string;
  user_id: string;
  room_id: string | null;
  banned_by: string;
  ban_type: "ban" | "kick" | "mute";
  reason: string | null;
  expires_at: string | null;
  created_at: string;
}

interface AdminPanelProps {
  roomId?: string;
}

const AdminPanel = ({ roomId }: AdminPanelProps) => {
  const { isAdmin, isModerator, getAllUsers, banUser, unbanUser, getBans, setUserRole } = useAdmin();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [bans, setBans] = useState<Ban[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [banType, setBanType] = useState<"ban" | "kick" | "mute">("mute");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("1h");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && isModerator) {
      loadData();
    }
  }, [open, isModerator]);

  const loadData = async () => {
    const [usersData, bansData] = await Promise.all([
      getAllUsers(),
      getBans(roomId),
    ]);
    setUsers(usersData);
    setBans(bansData);
  };

  const handleBan = async () => {
    if (!selectedUser) {
      toast({ title: "Foydalanuvchi tanlang", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    let expiresAt: Date | undefined;
    if (banDuration !== "forever") {
      expiresAt = new Date();
      const hours = parseInt(banDuration);
      expiresAt.setHours(expiresAt.getHours() + hours);
    }

    const { error } = await banUser(selectedUser, banType, roomId, banReason, expiresAt);
    
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: banType === "ban" ? "Bloklandi" : banType === "mute" ? "Ovozi o'chirildi" : "Chiqarildi",
        description: "Amal muvaffaqiyatli bajarildi",
      });
      loadData();
      setSelectedUser("");
      setBanReason("");
    }
    setLoading(false);
  };

  const handleUnban = async (banId: string) => {
    const { error } = await unbanUser(banId);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Blok olib tashlandi" });
      loadData();
    }
  };

  const handleRoleChange = async (userId: string, role: AppRole) => {
    if (!isAdmin) {
      toast({ title: "Faqat adminlar rol o'zgartira oladi", variant: "destructive" });
      return;
    }

    const { error } = await setUserRole(userId, role);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rol o'zgartirildi" });
      loadData();
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Crown className="h-3 w-3 mr-1" /> Admin</Badge>;
      case "moderator":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Shield className="h-3 w-3 mr-1" /> Moderator</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">User</Badge>;
    }
  };

  const getBanIcon = (type: string) => {
    switch (type) {
      case "ban": return <Ban className="h-4 w-4 text-red-400" />;
      case "mute": return <VolumeX className="h-4 w-4 text-yellow-400" />;
      case "kick": return <UserX className="h-4 w-4 text-orange-400" />;
      default: return null;
    }
  };

  if (!isModerator) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <MangaButton variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Admin
        </MangaButton>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-cyber-dark border-border">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="users" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-background/50">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Foydalanuvchilar
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <Ban className="h-4 w-4" /> Amallar
            </TabsTrigger>
            <TabsTrigger value="bans" className="gap-2">
              <UserX className="h-4 w-4" /> Bloklar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {users.map((user) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {user.display_name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.display_name || "Noma'lum"}</p>
                        <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getRoleBadge(user.role)
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="mt-4 space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Foydalanuvchi</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name || user.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amal turi</Label>
                <Select value={banType} onValueChange={(v) => setBanType(v as "ban" | "kick" | "mute")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mute">
                      <span className="flex items-center gap-2">
                        <VolumeX className="h-4 w-4" /> Ovozini o'chirish (Mute)
                      </span>
                    </SelectItem>
                    <SelectItem value="kick">
                      <span className="flex items-center gap-2">
                        <UserX className="h-4 w-4" /> Chiqarish (Kick)
                      </span>
                    </SelectItem>
                    <SelectItem value="ban">
                      <span className="flex items-center gap-2">
                        <Ban className="h-4 w-4" /> Bloklash (Ban)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Muddat</Label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 soat</SelectItem>
                    <SelectItem value="24">1 kun</SelectItem>
                    <SelectItem value="168">1 hafta</SelectItem>
                    <SelectItem value="720">1 oy</SelectItem>
                    <SelectItem value="forever">Doimiy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sabab (ixtiyoriy)</Label>
                <Input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Sabab kiriting..."
                  className="bg-background/50"
                />
              </div>

              <MangaButton
                variant="primary"
                onClick={handleBan}
                disabled={loading || !selectedUser}
                className="w-full"
              >
                {loading ? "Bajarilmoqda..." : "Tasdiqlash"}
              </MangaButton>
            </div>
          </TabsContent>

          <TabsContent value="bans" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                <AnimatePresence>
                  {bans.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Hozircha bloklar yo'q
                    </p>
                  ) : (
                    bans.map((ban) => {
                      const user = users.find(u => u.user_id === ban.user_id);
                      return (
                        <motion.div
                          key={ban.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            {getBanIcon(ban.ban_type)}
                            <div>
                              <p className="font-medium">{user?.display_name || ban.user_id.slice(0, 8)}</p>
                              {ban.reason && (
                                <p className="text-xs text-muted-foreground">{ban.reason}</p>
                              )}
                              {ban.expires_at && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(ban.expires_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <MangaButton
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnban(ban.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </MangaButton>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPanel;
