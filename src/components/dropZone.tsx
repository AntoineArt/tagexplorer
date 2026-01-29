import { useState, useCallback } from "react";

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileDrop, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && isValidFileType(file)) {
      onFileDrop(file);
    }
  }, [onFileDrop, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFileType(file)) {
      onFileDrop(file);
    }
    e.target.value = "";
  }, [onFileDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer
        ${isDragging
          ? "scale-[1.02]"
          : "hover:scale-[1.01]"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Background gradient */}
      <div className={`
        absolute inset-0 transition-opacity duration-300
        ${isDragging
          ? "opacity-100"
          : "opacity-0"
        }
        bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent
      `}></div>

      {/* Border */}
      <div className={`
        absolute inset-0 rounded-2xl border-2 border-dashed transition-all duration-300
        ${isDragging
          ? "border-emerald-400 shadow-[inset_0_0_30px_rgba(16,185,129,0.15)]"
          : "border-gray-600/50 hover:border-gray-500"
        }
      `}></div>

      {/* Content */}
      <div className="relative p-10">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          disabled={disabled}
        />
        <label
          htmlFor="file-input"
          className={`block text-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          {/* Icon */}
          <div className={`
            relative w-20 h-20 mx-auto mb-5 transition-transform duration-300
            ${isDragging ? "scale-110 animate-float" : ""}
          `}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-700/50">
              <span className="text-4xl">
                {isDragging ? "📥" : disabled ? "⏳" : "📁"}
              </span>
            </div>
          </div>

          {/* Text */}
          <p className="text-lg font-medium text-white mb-1">
            {disabled ? "Traitement en cours..." : isDragging ? "Déposez ici !" : "Glissez un fichier"}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            ou cliquez pour sélectionner
          </p>

          {/* File types */}
          <div className="flex items-center justify-center gap-3">
            <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20">
              JPG
            </span>
            <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-medium border border-purple-500/20">
              PNG
            </span>
            <span className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-medium border border-orange-500/20">
              PDF
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}

function isValidFileType(file: File): boolean {
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];
  return validTypes.includes(file.type);
}
