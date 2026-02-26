
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!botToken || !supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing environment variables");
    throw new Error("Missing required environment variables: TELEGRAM_BOT_TOKEN, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
    try {
        const url = new URL(req.url);

        // Handle Webhook
        if (req.method === "POST") {
            const update = await req.json();
            if (update.message) {
                await handleMessage(update.message);
            }
            return new Response("OK", { status: 200 });
        }

        return new Response("Method not allowed", { status: 405 });
    } catch (error) {
        console.error("Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
});

async function handleMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;
    const username = message.chat.username;

    if (!text) return;

    if (text.startsWith("/start")) {
        await sendMessage(chatId, "Welcome! To connect your account, go to the website settings, click 'Connect Telegram', and send me the code here.\nExample: /connect 123456");
    } else if (text.startsWith("/connect")) {
        const code = text.split(" ")[1];
        if (!code) {
            await sendMessage(chatId, "Please provide the code. Usage: /connect <code_from_website>");
            return;
        }
        await connectAccount(chatId, username, code);
    } else if (text.startsWith("/changepassword")) {
        const newPassword = text.split(" ")[1];
        if (!newPassword) {
            await sendMessage(chatId, "Please provide the new password. Usage: /changepassword <new_password>");
            return;
        }
        await changePassword(chatId, newPassword);
    } else if (text.startsWith("/disconnect")) {
        await disconnectAccount(chatId);
    } else {
        // If it's just a code (digits/letters) sent without command, try to connect
        if (/^[a-zA-Z0-9-]+$/.test(text.trim())) {
            await connectAccount(chatId, username, text.trim());
        } else {
            await sendMessage(chatId, "Unknown command. Available: /connect <code>, /changepassword <new_pass>, /disconnect");
        }
    }
}

async function sendMessage(chatId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
    });
}

async function connectAccount(chatId: number, username: string | undefined, code: string) {
    // Verify code
    const { data: codeData, error: codeError } = await supabase
        .from("telegram_codes")
        .select("user_id")
        .eq("code", code)
        .single();

    if (codeError || !codeData) {
        await sendMessage(chatId, "Invalid or expired code.");
        return;
    }

    // Check if telegram account is already linked to another user
    const { data: existingWrapper, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

    if (existingWrapper) {
        await sendMessage(chatId, "This Telegram account is already connected to a user. Please /disconnect first.");
        return;
    }

    // Update profile
    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            telegram_chat_id: chatId,
            telegram_username: username
        })
        .eq("user_id", codeData.user_id);

    if (updateError) {
        console.error("Update error:", updateError);
        await sendMessage(chatId, "Failed to link account. Please try again.");
        return;
    }

    // Delete the code
    await supabase.from("telegram_codes").delete().eq("code", code);

    await sendMessage(chatId, "Successfully connected! You can now user /changepassword to manage your account.");
}

async function changePassword(chatId: number, newPass: string) {
    // Get user_id from profiles
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("telegram_chat_id", chatId)
        .single();

    if (error || !profile) {
        await sendMessage(chatId, "You are not connected. Please connect first.");
        return;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
        profile.user_id,
        { password: newPass }
    );

    if (updateError) {
        await sendMessage(chatId, "Failed to update password: " + updateError.message);
    } else {
        await sendMessage(chatId, "Password updated successfully.");
    }
}

async function disconnectAccount(chatId: number) {
    const { error } = await supabase
        .from("profiles")
        .update({
            telegram_chat_id: null,
            telegram_username: null
        })
        .eq("telegram_chat_id", chatId);

    if (error) {
        await sendMessage(chatId, "Failed to disconnect.");
    } else {
        await sendMessage(chatId, "Disconnected successfully.");
    }
}
