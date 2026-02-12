import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rotate between 3 API keys
const getApiKey = (): string => {
  const keys = [
    Deno.env.get("GOOGLE_AI_KEY_1"),
    Deno.env.get("GOOGLE_AI_KEY_2"),
    Deno.env.get("GOOGLE_AI_KEY_3"),
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    // Fallback to Lovable AI
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey) return lovableKey;
    throw new Error("No API keys configured");
  }

  return keys[Math.floor(Math.random() * keys.length)];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, code, language } = await req.json();

    const systemPrompt = `Sen "CodeForge AI" - GitHub Copilot kabi kuchli AI kod yordamchisisisan. 
O'zbek tilida javob ber.

Sen quyidagilarni qila olasan:
1. Kod yozish va tushuntirish
2. Xatolarni topish va to'g'irlash
3. Yangi fayllar yaratish (format: [CREATE_FILE: fayl_nomi, path, language])
4. Yangi papkalar yaratish (format: [CREATE_FOLDER: papka_nomi, path])
5. Kodni optimizatsiya qilish
6. Testlar yozish
7. Dokumentatsiya yaratish

Maxsus buyruqlar formati:
- Yangi fayl yaratish: [CREATE_FILE: fayl_nomi.ext, /path/, language]
- Yangi papka yaratish: [CREATE_FOLDER: papka_nomi, /path/]

Agar kod yozib bersang, uni \`\`\`language ... \`\`\` ichida yoz.
Javoblaringni qisqa, aniq va foydali qil.
Bu BEPUL xizmat - foydalanuvchilar hech narsa to'lamaydi.

Hozirgi kod konteksti:
\`\`\`${language}
${code || "// Hali kod yo'q"}
\`\`\``;

    // Try with rotating Google keys first, fallback to Lovable AI
    let response: Response | null = null;
    let lastError = "";
    const googleKeys = [
      Deno.env.get("GOOGLE_AI_KEY_1"),
      Deno.env.get("GOOGLE_AI_KEY_2"),
      Deno.env.get("GOOGLE_AI_KEY_3"),
    ].filter(Boolean) as string[];

    // Shuffle keys for rotation
    for (let i = googleKeys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [googleKeys[i], googleKeys[j]] = [googleKeys[j], googleKeys[i]];
    }

    // Try each Google key
    for (const key of googleKeys) {
      try {
        const googleResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (googleResponse.ok) {
          const data = await googleResponse.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Javob olishda xatolik";
          return new Response(JSON.stringify({ response: text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        lastError = `Google API ${googleResponse.status}`;
        console.error(`Google key failed: ${googleResponse.status}`);
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Unknown error";
        console.error("Google key error:", lastError);
      }
    }

    // Fallback to Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      console.log("Falling back to Lovable AI Gateway");
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantResponse = data.choices?.[0]?.message?.content || "Javob olishda xatolik";
        return new Response(JSON.stringify({ response: assistantResponse }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Juda ko'p so'rov. Biroz kuting va qayta urinib ko'ring." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI xizmati bepul rejimda. Tez orada yangi limitlar beriladi." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError}`);
  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
