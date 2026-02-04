import { memo } from "react";

interface GraphControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
}

export const GraphControls = memo(function GraphControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitToView,
}: GraphControlsProps) {
  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-2">
      <div className="glass-light rounded-xl overflow-hidden flex flex-col">
        <button
          onClick={onZoomIn}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Zoomer"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div className="w-full h-px bg-gray-700/50" />
        <button
          onClick={onZoomOut}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dézoomer"
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
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div className="w-full h-px bg-gray-700/50" />
        <button
          onClick={onFitToView}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Ajuster à la vue"
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
      <div className="glass-light px-2 py-1 rounded-lg">
        <span className="text-xs text-gray-400 font-mono">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>
    </div>
  );
});
