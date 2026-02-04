import { useEffect, useCallback, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { TagChip } from "./tagChip";
import { ConfirmModal } from "./confirmModal";

interface FilePreviewProps {
  fileId: Id<"files">;
  onClose: () => void;
}

function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) return "Inconnu";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ fileId, onClose }: FilePreviewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  const files = useQuery(api.files.listFiles) ?? [];
  const file = files.find((f) => f._id === fileId);

  const fileUrl = useQuery(
    api.files.getFileUrl,
    file ? { storageId: file.storageId } : "skip"
  );

  const fileTags = useQuery(api.tags.getFileTags, { fileId }) ?? [];
  const unlinkFileTag = useMutation(api.tags.unlinkFileTag);
  const softDeleteFile = useMutation(api.files.softDeleteFile);
  const renameFile = useMutation(api.files.renameFile);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showDeleteConfirm && !isRenaming) {
        onClose();
      }
    },
    [onClose, showDeleteConfirm, isRenaming]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (file) {
      setNewName(file.name);
    }
  }, [file]);

  if (!file) {
    return null;
  }

  const handleRemoveTag = async (tagId: Id<"tags">) => {
    await unlinkFileTag({ fileId, tagId });
  };

  const handleDelete = async () => {
    await softDeleteFile({ fileId });
    onClose();
  };

  const handleRename = async () => {
    if (newName.trim() && newName !== file.name) {
      await renameFile({ fileId, name: newName.trim() });
    }
    setIsRenaming(false);
  };

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const isLoading = fileUrl === undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

        <div
          className="relative w-full max-w-5xl max-h-[90vh] glass rounded-3xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-2xl">
                  {isImage ? "🖼️" : isPdf ? "📑" : "📄"}
                </span>
              </div>
              <div>
                {isRenaming ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename();
                        if (e.key === "Escape") setIsRenaming(false);
                      }}
                      className="bg-gray-800 text-white px-3 py-1 rounded-lg text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                      autoFocus
                    />
                    <button
                      onClick={handleRename}
                      className="text-emerald-400 hover:text-emerald-300"
                      aria-label="Valider le renommage"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setIsRenaming(false)}
                      className="text-gray-400 hover:text-gray-300"
                      aria-label="Annuler le renommage"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-lg font-bold text-white truncate max-w-md">
                      {file.name}
                    </h2>
                    <button
                      onClick={() => setIsRenaming(true)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
                      aria-label="Renommer le fichier"
                    >
                      ✏️
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500">{file.type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="flex gap-8">
              <div className="flex-1 min-w-0">
                <div className="relative rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-700/30">
                  {isLoading && (isImage || isPdf) && (
                    <div className="flex items-center justify-center h-64">
                      <div className="w-full h-full animate-shimmer bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]" />
                    </div>
                  )}
                  {isImage && fileUrl && (
                    <img
                      src={fileUrl}
                      alt={file.name}
                      className="w-full max-h-[60vh] object-contain"
                    />
                  )}
                  {isPdf && fileUrl && (
                    <embed
                      src={fileUrl}
                      type="application/pdf"
                      className="w-full h-[60vh]"
                    />
                  )}
                  {!isImage && !isPdf && (
                    <div className="flex items-center justify-center h-64 text-gray-600">
                      <div className="text-center">
                        <span className="text-8xl block mb-4">📄</span>
                        <p>Aperçu non disponible</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-72 flex-shrink-0 space-y-6">
                <div className="glass-light rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Informations
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Taille</p>
                      <p className="text-sm text-white">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm text-white">
                        {file.type.includes("image") ? "Image" : "Document"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ajouté le</p>
                      <p className="text-sm text-white">
                        {new Date(file.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-light rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      Tags
                    </h3>
                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                      {fileTags.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {fileTags.map((tag) => (
                      <TagChip
                        key={tag._id}
                        name={tag.name}
                        color={tag.color}
                        onRemove={() => handleRemoveTag(tag._id)}
                      />
                    ))}
                    {fileTags.length === 0 && (
                      <p className="text-sm text-gray-600 italic">Aucun tag</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      download={file.name}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors font-medium"
                    >
                      <span>⬇️</span> Télécharger
                    </a>
                  )}

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all font-medium"
                  >
                    <span>🗑️</span> Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Supprimer ce fichier ?"
        message="Le fichier sera placé dans la corbeille. Vous pourrez le restaurer ultérieurement."
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
