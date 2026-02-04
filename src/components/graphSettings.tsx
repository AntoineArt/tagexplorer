import { useState, memo } from "react";

interface GraphSettingsProps {
  chargeStrength: number;
  linkDistance: number;
  onChargeStrengthChange: (value: number) => void;
  onLinkDistanceChange: (value: number) => void;
}

const PRESETS = {
  compact: { charge: -30, distance: 30 },
  default: { charge: -60, distance: 50 },
  spread: { charge: -120, distance: 100 },
};

export const GraphSettings = memo(function GraphSettings({
  chargeStrength,
  linkDistance,
  onChargeStrengthChange,
  onLinkDistanceChange,
}: GraphSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const applyPreset = (preset: keyof typeof PRESETS) => {
    onChargeStrengthChange(PRESETS[preset].charge);
    onLinkDistanceChange(PRESETS[preset].distance);
  };

  return (
    <div className="absolute bottom-6 left-6 z-20">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="glass-light w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="Paramètres du graphe"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      ) : (
        <div className="glass rounded-2xl p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Paramètres du graphe
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Fermer les paramètres"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Répulsion</label>
                <span className="text-xs text-gray-500 font-mono">
                  {chargeStrength}
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="-20"
                value={chargeStrength}
                onChange={(e) =>
                  onChargeStrengthChange(Number(e.target.value))
                }
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Distance liens</label>
                <span className="text-xs text-gray-500 font-mono">
                  {linkDistance}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                value={linkDistance}
                onChange={(e) => onLinkDistanceChange(Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="pt-2 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2">Préréglages</p>
              <div className="flex gap-2">
                <button
                  onClick={() => applyPreset("compact")}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                >
                  Compact
                </button>
                <button
                  onClick={() => applyPreset("default")}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                >
                  Défaut
                </button>
                <button
                  onClick={() => applyPreset("spread")}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                >
                  Étalé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
