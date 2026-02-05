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
    const { code, language, cursorPosition, projectContext, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "inline") {
      // Inline completions - kod davom ettirish
      systemPrompt = `Sen GitHub Copilot kabi kod yordamchisisan. Foydalanuvchi yozayotgan kodni davom ettir.

Qoidalar:
1. FAQAT kod yoz, tushuntirma yoki markdown ishlatma
2. Kod logikasini to'g'ri davom ettir
3. Iloji boricha qisqa lekin to'liq javob ber
4. Hozirgi kontekstni hisobga ol
5. Sintaksis xatosiz kod yoz`;

      userPrompt = `Til: ${language}
Cursor pozitsiyasi: ${cursorPosition.line}:${cursorPosition.column}

Kod:
${code}

Kodning davomini yoz (FAQAT kod, hech qanday tushuntirma yoki markdown emas):`;
    } else if (type === "explain") {
      systemPrompt = `Sen tajribali dasturchi va o'qituvchisan. Kodni tushunarli qilib tushuntir. O'zbek tilida javob ber.`;
      userPrompt = `Bu ${language} kodini tushuntir:\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (type === "fix") {
      systemPrompt = `Sen tajribali dasturchi va debuggersan. Koddagi xatolarni top va to'g'irla. O'zbek tilida javob ber.`;
      userPrompt = `Bu ${language} kodida xato bor. Xatoni top va to'g'rilangan kodni qaytaring:\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (type === "tests") {
      systemPrompt = `Sen test yozish bo'yicha mutaxassisan. Kod uchun unit testlar yoz.`;
      userPrompt = `Bu ${language} kod uchun unit testlar yoz:\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (type === "refactor") {
      systemPrompt = `Sen kod sifati bo'yicha mutaxassisan. Kodni yaxshila va optimizatsiya qil.`;
      userPrompt = `Bu ${language} kodni refaktor qil va yaxshila:\n\`\`\`${language}\n${code}\n\`\`\``;
    } else if (type === "docs") {
      systemPrompt = `Sen texnik yozuvchi san. Kod uchun dokumentatsiya yoz.`;
      userPrompt = `Bu ${language} kod uchun JSDoc/docstring yoz:\n\`\`\`${language}\n${code}\n\`\`\``;
    }

    // Loyiha kontekstini qo'sh
    if (projectContext && projectContext.files) {
      systemPrompt += `\n\nLoyiha konteksti:\n${projectContext.files.map((f: any) => `- ${f.path}${f.name}`).join("\n")}`;
    }

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
          { role: "user", content: userPrompt }
        ],
        temperature: type === "inline" ? 0.3 : 0.7,
        max_tokens: type === "inline" ? 256 : 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Biroz kuting va qayta urinib ko'ring." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI xizmati bepul rejimda ishlayapti. Hozircha limitga yetdingiz." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let completion = data.choices?.[0]?.message?.content || "";

    // Inline completion uchun kod bloklarini olib tashla
    if (type === "inline") {
      completion = completion
        .replace(/```[\w]*\n?/g, "")
        .replace(/```/g, "")
        .trim();
    }

    return new Response(JSON.stringify({ completion, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Completions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
