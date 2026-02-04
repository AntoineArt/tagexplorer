import { useState, useCallback } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AnalysisResult {
  storageId: string;
  existingTags: string[];
  newTags: string[];
  suggestedName: string | null;
}

interface UseFileAnalysisReturn {
  analyze: (file: File) => Promise<AnalysisResult | null>;
  isAnalyzing: boolean;
  error: string | null;
  retryCount: number;
  reset: () => void;
}

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

export function useFileAnalysis(): UseFileAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const allTags = useQuery(api.tags.listTags) ?? [];
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const analyzeFile = useAction(api.analyze.analyzeFile);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsAnalyzing(false);
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const analyze = useCallback(
    async (file: File): Promise<AnalysisResult | null> => {
      setError(null);
      setIsAnalyzing(true);
      setRetryCount(0);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          setRetryCount(attempt + 1);

          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!result.ok) {
            throw new Error("UPLOAD_FAILED");
          }

          const { storageId } = await result.json();

          const existingTagNames = allTags.map((t) => t.name);
          const analysis = await analyzeFile({
            storageId,
            fileType: file.type,
            fileName: file.name,
            existingTags: existingTagNames,
          });

          setIsAnalyzing(false);
          setRetryCount(0);

          return {
            storageId,
            existingTags: analysis.existingTags,
            newTags: analysis.newTags,
            suggestedName: analysis.suggestedName,
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          if (attempt < MAX_RETRIES - 1) {
            const delay = INITIAL_DELAY * Math.pow(2, attempt);
            await sleep(delay);
          }
        }
      }

      setIsAnalyzing(false);
      const errorMessage = getErrorMessage(lastError?.message || "UNKNOWN_ERROR");
      setError(errorMessage);
      return null;
    },
    [generateUploadUrl, analyzeFile, allTags]
  );

  return { analyze, isAnalyzing, error, retryCount, reset };
}

function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    UPLOAD_FAILED: "Échec de l'upload du fichier. Vérifiez votre connexion.",
    AI_GATEWAY_API_KEY_MISSING:
      "Clé API non configurée. Contactez l'administrateur.",
    FILE_NOT_FOUND: "Fichier introuvable dans le stockage.",
    AI_ANALYSIS_FAILED:
      "L'analyse IA a échoué. Réessayez ou ajoutez des tags manuellement.",
    RATE_LIMITED: "Trop de requêtes. Attendez quelques instants.",
    UNKNOWN_ERROR: "Une erreur inattendue s'est produite. Veuillez réessayer.",
  };

  return messages[code] || messages.UNKNOWN_ERROR;
}
