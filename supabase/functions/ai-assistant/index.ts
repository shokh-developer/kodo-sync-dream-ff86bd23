import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const systemPrompt = `Sen CodeForge AI yordamchisisan - GitHub Copilot kabi kuchli dasturlash yordamchisi.
    
Sening imkoniyatlaring:
1. Kod yozish va tushuntirish
2. Xatolarni topish va tuzatish
3. Yangi fayl yaratish buyrug'ini berish
4. Yangi papka yaratish buyrug'ini berish
5. Kodni optimizatsiya qilish
6. HTML, CSS, JavaScript fayllarini bir-biriga bog'lash haqida maslahat

Maxsus buyruqlar formati:
- Yangi fayl yaratish: [CREATE_FILE: fayl_nomi.ext, /path/, language]
  Masalan: [CREATE_FILE: style.css, /, css]
  Masalan: [CREATE_FILE: script.js, /assets/, javascript]
  
- Yangi papka yaratish: [CREATE_FOLDER: papka_nomi, /path/]
  Masalan: [CREATE_FOLDER: assets, /]
  Masalan: [CREATE_FOLDER: styles, /src/]

Qoidalar:
1. Faqat berilgan til (${language}) kontekstida yordam ber
2. Kod misollari bilan javob ber (markdown code block ichida)
3. Qisqa va aniq javoblar ber
4. Xatolarni tushuntir va to'g'irlash yo'lini ko'rsat
5. O'zbek yoki ingliz tilida javob ber (foydalanuvchi tiliga qarab)
6. Agar foydalanuvchi fayl yaratishni so'rasa, [CREATE_FILE: ...] formatida buyruq ber
7. Agar foydalanuvchi papka yaratishni so'rasa, [CREATE_FOLDER: ...] formatida buyruq ber
8. HTML da CSS va JS fayllarni bog'lash uchun <link> va <script> teglari haqida maslahat ber

HTML + CSS + JS bog'lash misoli:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Salom</h1>
  <script src="script.js"></script>
</body>
</html>
\`\`\`

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
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Juda ko'p so'rov. Biroz kutib qayta urinib ko'ring." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredit tugadi. Lovable hisobingizga kredit qo'shing." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Javob olishda xatolik";

    return new Response(JSON.stringify({ response: text }), {
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