interface TagChipProps {
  name: string;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  color?: string;
  isNew?: boolean;
}

export function TagChip({ name, selected = true, onToggle, onRemove, color, isNew }: TagChipProps) {
  const selectedClass = isNew
    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-105"
    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105";

  return (
    <span
      className={`
        group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200 cursor-pointer select-none
        ${selected
          ? selectedClass
          : "bg-gray-800/50 text-gray-500 hover:bg-gray-800 hover:text-gray-400"
        }
      `}
      style={color && selected ? { background: `linear-gradient(135deg, ${color}, ${color}dd)` } : undefined}
      onClick={onToggle}
    >
      {/* Selection indicator */}
      {onToggle && (
        <span className={`
          flex items-center justify-center w-4 h-4 rounded-full text-[10px] transition-all
          ${selected
            ? "bg-white/20"
            : "bg-gray-700 text-gray-600"
          }
        `}>
          {selected ? "✓" : "○"}
        </span>
      )}

      {/* Tag name */}
      <span className={selected ? "" : "line-through opacity-60"}>
        {name}
      </span>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            flex items-center justify-center w-4 h-4 rounded-full
            bg-white/10 hover:bg-red-500 text-white/70 hover:text-white
            transition-all text-xs ml-0.5
          "
        >
          ×
        </button>
      )}

      {/* Glow effect on hover */}
      {selected && (
        <span className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity ${
          isNew ? "bg-gradient-to-r from-violet-400 to-purple-400" : "bg-gradient-to-r from-emerald-400 to-teal-400"
        }`}></span>
      )}
    </span>
  );
}
