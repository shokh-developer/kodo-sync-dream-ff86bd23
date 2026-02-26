import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, code, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
- Mavjud faylni o'zgartirish: [UPDATE_FILE: /path/fayl_nomi.ext] (Ketidan kod bloki kelishi shart)

Agar kod yozib bersang, uni \`\`\`language ... \`\`\` ichida yoz.
Javoblaringni qisqa, aniq va foydali qil.
Bu BEPUL xizmat - foydalanuvchilar hech narsa to'lamaydi.

Hozirgi kod konteksti:
\`\`\`${language}
${code || "// Hali kod yo'q"}
\`\`\``;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

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

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "Javob olishda xatolik yuz berdi";

    return new Response(JSON.stringify({ response: assistantResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});