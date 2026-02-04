import { useEffect, useCallback, memo } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: "default" | "warning" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  title,
  message,
  variant = "default",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter") {
        onConfirm();
      }
    },
    [onCancel, onConfirm]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const variantStyles = {
    default: {
      icon: "✓",
      iconBg: "from-emerald-500/20 to-teal-500/20",
      confirmBg:
        "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25",
    },
    warning: {
      icon: "⚠️",
      iconBg: "from-amber-500/20 to-orange-500/20",
      confirmBg:
        "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/25",
    },
    danger: {
      icon: "🗑️",
      iconBg: "from-red-500/20 to-rose-500/20",
      confirmBg:
        "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/25",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md glass rounded-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${styles.iconBg} flex items-center justify-center`}
        >
          <span className="text-3xl">{styles.icon}</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl text-white font-medium shadow-lg transition-all ${styles.confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
