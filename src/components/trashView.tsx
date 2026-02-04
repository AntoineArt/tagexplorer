import { memo, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConfirmModal } from "./confirmModal";

interface TrashViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashView = memo(function TrashView({
  isOpen,
  onClose,
}: TrashViewProps) {
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"files"> | null>(null);

  const deletedFiles = useQuery(api.files.listDeletedFiles) ?? [];
  const restoreFile = useMutation(api.files.restoreFile);
  const permanentDeleteFile = useMutation(api.files.permanentDeleteFile);
  const emptyTrash = useMutation(api.files.emptyTrash);

  const handleRestore = useCallback(
    async (fileId: Id<"files">) => {
      await restoreFile({ fileId });
    },
    [restoreFile]
  );

  const handlePermanentDelete = useCallback(async () => {
    if (confirmDeleteId) {
      await permanentDeleteFile({ fileId: confirmDeleteId });
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, permanentDeleteFile]);

  const handleEmptyTrash = useCallback(async () => {
    await emptyTrash();
    setConfirmEmptyTrash(false);
  }, [emptyTrash]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-lg glass rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <span className="text-xl">🗑️</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Corbeille</h2>
                <p className="text-xs text-gray-500">
                  {deletedFiles.length} élément{deletedFiles.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {deletedFiles.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl block mb-4">🗑️</span>
                <p className="text-gray-500">La corbeille est vide</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deletedFiles.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-xl">
                      {file.type.startsWith("image/") ? "🖼️" : "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Supprimé le{" "}
                        {file.deletedAt
                          ? new Date(file.deletedAt).toLocaleDateString("fr-FR")
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestore(file._id)}
                        className="w-8 h-8 rounded-lg hover:bg-emerald-500/20 flex items-center justify-center text-gray-400 hover:text-emerald-400 transition-colors"
                        title="Restaurer"
                        aria-label="Restaurer"
                      >
                        ↩️
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(file._id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                        title="Supprimer définitivement"
                        aria-label="Supprimer définitivement"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {deletedFiles.length > 0 && (
            <div className="p-5 border-t border-gray-700/50">
              <button
                onClick={() => setConfirmEmptyTrash(true)}
                className="w-full px-4 py-3 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all font-medium"
              >
                Vider la corbeille
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Supprimer définitivement ?"
        message="Ce fichier sera définitivement supprimé. Cette action est irréversible."
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={handlePermanentDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmModal
        isOpen={confirmEmptyTrash}
        title="Vider la corbeille ?"
        message={`${deletedFiles.length} fichier${deletedFiles.length !== 1 ? "s" : ""} seront définitivement supprimés. Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Vider"
        onConfirm={handleEmptyTrash}
        onCancel={() => setConfirmEmptyTrash(false)}
      />
    </>
  );
});
