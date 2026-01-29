import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { TagChip } from "./tagChip";

interface FilePreviewProps {
  fileId: Id<"files">;
  onClose: () => void;
}

export function FilePreview({ fileId, onClose }: FilePreviewProps) {
  const files = useQuery(api.files.listFiles) ?? [];
  const file = files.find((f) => f._id === fileId);

  const fileUrl = useQuery(
    api.files.getFileUrl,
    file ? { storageId: file.storageId } : "skip"
  );

  const fileTags = useQuery(api.tags.getFileTags, { fileId }) ?? [];
  const unlinkFileTag = useMutation(api.tags.unlinkFileTag);
  const deleteFile = useMutation(api.files.deleteFile);

  if (!file) {
    return null;
  }

  const handleRemoveTag = async (tagId: Id<"tags">) => {
    await unlinkFileTag({ fileId, tagId });
  };

  const handleDelete = async () => {
    if (confirm("Supprimer ce fichier ?")) {
      await deleteFile({ fileId });
      onClose();
    }
  };

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] glass rounded-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-2xl">{isImage ? "🖼️" : isPdf ? "📑" : "📄"}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white truncate max-w-md">{file.name}</h2>
              <p className="text-sm text-gray-500">{file.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-8">
            {/* Preview */}
            <div className="flex-1 min-w-0">
              <div className="relative rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-700/30">
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

            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 space-y-6">
              {/* Info Card */}
              <div className="glass-light rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Informations</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Taille</p>
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

              {/* Tags Card */}
              <div className="glass-light rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tags</h3>
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

              {/* Actions */}
              <div className="space-y-3">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download={file.name}
                    className="
                      w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                      bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white
                      transition-colors font-medium
                    "
                  >
                    <span>⬇️</span> Télécharger
                  </a>
                )}

                <button
                  onClick={handleDelete}
                  className="
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300
                    border border-red-500/20 hover:border-red-500/40
                    transition-all font-medium
                  "
                >
                  <span>🗑️</span> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
