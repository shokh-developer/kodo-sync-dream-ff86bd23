import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PISTON_API = "https://emkc.org/api/v2/piston/execute";

// Extended language mappings
const languageMap: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  cpp: { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  java: { language: "java", version: "15.0.2" },
  go: { language: "go", version: "1.16.2" },
  rust: { language: "rust", version: "1.68.2" },
  php: { language: "php", version: "8.2.3" },
  ruby: { language: "ruby", version: "3.0.1" },
  csharp: { language: "csharp", version: "6.12.0" },
  swift: { language: "swift", version: "5.3.3" },
  kotlin: { language: "kotlin", version: "1.8.20" },
  dart: { language: "dart", version: "2.19.6" },
  lua: { language: "lua", version: "5.4.4" },
  perl: { language: "perl", version: "5.36.0" },
  r: { language: "r", version: "4.1.1" },
  scala: { language: "scala", version: "3.2.2" },
  bash: { language: "bash", version: "5.2.0" },
  sql: { language: "sqlite3", version: "3.36.0" },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, stdin } = await req.json();

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: "Code and language are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const langConfig = languageMap[language];
    
    if (!langConfig) {
      return new Response(
        JSON.stringify({ 
          error: `Unsupported language: ${language}`,
          supported: Object.keys(languageMap)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Executing ${language} code with stdin: ${stdin ? 'yes' : 'no'}`);

    const response = await fetch(PISTON_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [{ name: getFileName(language), content: code }],
        stdin: stdin || "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Piston API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to execute code", details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    const output = {
      success: true,
      language: result.language,
      version: result.version,
      compile: result.compile ? {
        stdout: result.compile.stdout || "",
        stderr: result.compile.stderr || "",
        code: result.compile.code,
      } : null,
      run: {
        stdout: result.run?.stdout || "",
        stderr: result.run?.stderr || "",
        code: result.run?.code,
        signal: result.run?.signal,
      },
    };

    return new Response(
      JSON.stringify(output),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getFileName(language: string): string {
  const extensions: Record<string, string> = {
    javascript: "index.js",
    typescript: "index.ts",
    python: "main.py",
    cpp: "main.cpp",
    c: "main.c",
    java: "Main.java",
    go: "main.go",
    rust: "main.rs",
    php: "index.php",
    ruby: "main.rb",
    csharp: "Program.cs",
    swift: "main.swift",
    kotlin: "Main.kt",
    dart: "main.dart",
    lua: "main.lua",
    perl: "main.pl",
    r: "main.r",
    scala: "Main.scala",
    bash: "main.sh",
    sql: "main.sql",
  };
  return extensions[language] || "main.txt";
}
