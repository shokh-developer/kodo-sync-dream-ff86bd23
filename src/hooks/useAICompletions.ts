import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CursorPosition {
  line: number;
  column: number;
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  is_folder: boolean;
}

interface CompletionResult {
  completion: string;
  type: string;
}

export const useAICompletions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Inline completion - Tab bilan qabul qilinadigan
  const getInlineCompletion = useCallback(
    async (
      code: string,
      language: string,
      cursorPosition: CursorPosition,
      files?: FileItem[]
    ): Promise<string | null> => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setCurrentSuggestion(null);

      try {
        const { data, error } = await supabase.functions.invoke("ai-completions", {
          body: {
            code,
            language,
            cursorPosition,
            projectContext: files ? { files: files.slice(0, 20) } : null,
            type: "inline",
          },
        });

        if (error) throw error;

        const suggestion = data?.completion || null;
        setCurrentSuggestion(suggestion);
        return suggestion;
      } catch (error: any) {
        if (error.name !== "AbortError") {
          // Silently handle - don't spam console for rate limits
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Kodni tushuntirish
  const explainCode = useCallback(
    async (code: string, language: string): Promise<string | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-completions", {
          body: { code, language, type: "explain" },
        });

        if (error) throw error;
        return data?.completion || null;
      } catch (error) {
        console.error("Explain code error:", error);
        toast({
          title: "Xatolik",
          description: "Kodni tushuntirishda xatolik",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Kodni to'g'irlash
  const fixCode = useCallback(
    async (code: string, language: string): Promise<string | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-completions", {
          body: { code, language, type: "fix" },
        });

        if (error) throw error;
        return data?.completion || null;
      } catch (error) {
        console.error("Fix code error:", error);
        toast({
          title: "Xatolik",
          description: "Kodni to'g'irlashda xatolik",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Test yozish
  const generateTests = useCallback(
    async (code: string, language: string): Promise<string | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-completions", {
          body: { code, language, type: "tests" },
        });

        if (error) throw error;
        return data?.completion || null;
      } catch (error) {
        console.error("Generate tests error:", error);
        toast({
          title: "Xatolik",
          description: "Test yaratishda xatolik",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Refaktor qilish
  const refactorCode = useCallback(
    async (code: string, language: string): Promise<string | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-completions", {
          body: { code, language, type: "refactor" },
        });

        if (error) throw error;
        return data?.completion || null;
      } catch (error) {
        console.error("Refactor code error:", error);
        toast({
          title: "Xatolik",
          description: "Kodni refaktor qilishda xatolik",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Dokumentatsiya yozish
  const generateDocs = useCallback(
    async (code: string, language: string): Promise<string | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-completions", {
          body: { code, language, type: "docs" },
        });

        if (error) throw error;
        return data?.completion || null;
      } catch (error) {
        console.error("Generate docs error:", error);
        toast({
          title: "Xatolik",
          description: "Dokumentatsiya yaratishda xatolik",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const clearSuggestion = useCallback(() => {
    setCurrentSuggestion(null);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isLoading,
    currentSuggestion,
    getInlineCompletion,
    explainCode,
    fixCode,
    generateTests,
    refactorCode,
    generateDocs,
    clearSuggestion,
    cancelRequest,
  };
};
