import { memo } from "react";

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

export const ColorPicker = memo(function ColorPicker({
  selectedColor,
  onColorSelect,
  onClose,
}: ColorPickerProps) {
  return (
    <div
      className="absolute z-30 mt-2 glass rounded-xl p-3 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 font-medium">Couleur du tag</p>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Fermer le sélecteur de couleur"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
      <div className="grid grid-cols-4 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              onColorSelect(color);
              onClose();
            }}
            className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
              selectedColor === color
                ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                : ""
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Sélectionner la couleur ${color}`}
          />
        ))}
      </div>
      <button
        onClick={() => {
          onColorSelect("");
          onClose();
        }}
        className="w-full mt-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        Réinitialiser
      </button>
    </div>
  );
});
