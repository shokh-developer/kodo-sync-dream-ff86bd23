
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function TelegramConnect() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "";
    const botLink = botUsername ? `https://t.me/${botUsername}` : "https://t.me/";

    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setUserId(null);
                return null;
            }
            setUserId(user.id);

            const { data, error } = await supabase
                .from("profiles")
                .select("telegram_username, telegram_chat_id")
                .eq("user_id", user.id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    useEffect(() => {
        if (!userId) return;
        const savedCode = localStorage.getItem(`telegram_code:${userId}`);
        if (savedCode && !generatedCode) {
            setGeneratedCode(savedCode);
        }
    }, [userId, generatedCode]);

    useEffect(() => {
        if (!userId) return;
        if (profile?.telegram_chat_id) {
            setGeneratedCode(null);
            localStorage.removeItem(`telegram_code:${userId}`);
        }
    }, [profile?.telegram_chat_id, userId]);

    const generateCodeMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const bytes = new Uint8Array(4);
            crypto.getRandomValues(bytes);
            const code = Array.from(bytes).map(b => (b % 36).toString(36)).join("").substring(0, 6).toUpperCase();

            const { error } = await supabase
                .from("telegram_codes")
                .insert({ code, user_id: user.id });

            if (error) throw error;
            return code;
        },
        onSuccess: (code) => {
            setGeneratedCode(code);
            if (userId) {
                localStorage.setItem(`telegram_code:${userId}`, code);
            }
            toast({
                title: "Code Generated",
                description: `Send this code to the bot: ${code}`,
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate code.",
            });
        }
    });

    // Poll for connection status if code is generated
    useQuery({
        queryKey: ["check-connection"],
        queryFn: async () => {
            // Just invalidate profile to refetch
            await queryClient.invalidateQueries({ queryKey: ["profile"] });
            return true;
        },
        enabled: !!generatedCode && !profile?.telegram_chat_id,
        refetchInterval: 3000,
    });

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    const isConnected = !!profile?.telegram_chat_id;
    const isLoggedIn = !!userId;
    const handleCancel = () => {
        setGeneratedCode(null);
        if (userId) {
            localStorage.removeItem(`telegram_code:${userId}`);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Telegram Integration
                </CardTitle>
                <CardDescription>
                    Connect your Telegram account to manage your password and receive notifications.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isLoggedIn && (
                    <div className="text-sm text-muted-foreground">
                        Please sign in to connect your Telegram account.
                    </div>
                )}
                {isConnected ? (
                    <div className="flex flex-col items-center gap-4 py-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <ShieldCheck className="h-12 w-12 text-green-500" />
                        <div className="text-center">
                            <p className="font-medium text-lg">Connected</p>
                            <p className="text-sm text-muted-foreground">
                                Username: @{profile.telegram_username || "Unknown"}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground px-4 text-center">
                            To disconnect, please send the command <code>/disconnect</code> to the bot directly.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!generatedCode ? (
                            <Button
                                onClick={() => generateCodeMutation.mutate()}
                                disabled={generateCodeMutation.isPending || !isLoggedIn}
                                className="w-full"
                            >
                                {generateCodeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Connection Code
                            </Button>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-muted rounded-lg border">
                                    <p className="text-sm text-muted-foreground mb-2">Send this code to the bot:</p>
                                    <p className="text-3xl font-mono font-bold tracking-wider">{generatedCode}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Waiting for connection...
                                </p>
                                <Button variant="ghost" size="sm" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-4">
                            <p>1. Open our Telegram Bot.</p>
                            <p>2. Click Start.</p>
                            <p>3. Send the code shown above.</p>
                            <p className="mt-2">
                                Bot link: <a className="underline" href={botLink} target="_blank" rel="noreferrer">{botLink}</a>
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
