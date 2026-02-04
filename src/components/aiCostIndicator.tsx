import { useState, useEffect, memo } from "react";

const COST_PER_ANALYSIS = 0.001; // Estimated cost per analysis in USD
const STORAGE_KEY = "tagexplorer-ai-cost";

interface AICostIndicatorProps {
  onAnalysisComplete?: () => void;
}

export const AICostIndicator = memo(function AICostIndicator({
  onAnalysisComplete,
}: AICostIndicatorProps) {
  const [totalCost, setTotalCost] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTotalCost(data.totalCost || 0);
        setAnalysisCount(data.analysisCount || 0);
      } catch {
        // Invalid data, reset
      }
    }
  }, []);

  useEffect(() => {
    if (onAnalysisComplete) {
      const newCost = totalCost + COST_PER_ANALYSIS;
      const newCount = analysisCount + 1;
      setTotalCost(newCost);
      setAnalysisCount(newCount);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ totalCost: newCost, analysisCount: newCount })
      );
    }
  }, [onAnalysisComplete]);

  const resetStats = () => {
    setTotalCost(0);
    setAnalysisCount(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-light px-3 py-2 rounded-xl flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        title="Coût IA estimé"
        aria-label="Coût IA estimé"
      >
        <span>🤖</span>
        <span className="text-xs font-mono">${totalCost.toFixed(3)}</span>
      </button>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 glass rounded-xl p-4 w-64 shadow-xl z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">
              Statistiques IA
            </h4>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Analyses totales</span>
              <span className="text-sm text-white font-mono">
                {analysisCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Coût estimé</span>
              <span className="text-sm text-emerald-400 font-mono">
                ${totalCost.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Coût/analyse</span>
              <span className="text-sm text-gray-300 font-mono">
                ~${COST_PER_ANALYSIS.toFixed(4)}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2">
                Estimation basée sur Gemini Flash Lite. Le coût réel peut varier.
              </p>
              <button
                onClick={resetStats}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Export function to track analysis from outside
export function trackAnalysis(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  let data = { totalCost: 0, analysisCount: 0 };
  if (stored) {
    try {
      data = JSON.parse(stored);
    } catch {
      // Invalid data
    }
  }
  data.totalCost += COST_PER_ANALYSIS;
  data.analysisCount += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
