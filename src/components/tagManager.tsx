import { useState, useCallback, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ColorPicker } from "./colorPicker";
import { ConfirmModal } from "./confirmModal";

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TagManager = memo(function TagManager({
  isOpen,
  onClose,
}: TagManagerProps) {
  const [editingTagId, setEditingTagId] = useState<Id<"tags"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const [colorPickerTagId, setColorPickerTagId] = useState<Id<"tags"> | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<Id<"tags"> | null>(null);
  const [mergeSource, setMergeSource] = useState<Id<"tags"> | null>(null);

  const tags = useQuery(api.tags.listTags) ?? [];
  const fileTags = useQuery(api.tags.listFileTags) ?? [];

  const renameTag = useMutation(api.tags.renameTag);
  const updateTagColor = useMutation(api.tags.updateTagColor);
  const deleteTag = useMutation(api.tags.deleteTag);
  const mergeTags = useMutation(api.tags.mergeTags);

  const getTagFileCount = useCallback(
    (tagId: Id<"tags">) => {
      return fileTags.filter((ft) => ft.tagId === tagId).length;
    },
    [fileTags]
  );

  const handleRename = useCallback(
    async (tagId: Id<"tags">) => {
      if (editingName.trim()) {
        try {
          await renameTag({ tagId, name: editingName.trim() });
        } catch (e) {
          // Handle error - name already exists
        }
      }
      setEditingTagId(null);
      setEditingName("");
    },
    [editingName, renameTag]
  );

  const handleDelete = useCallback(async () => {
    if (deleteTagId) {
      await deleteTag({ tagId: deleteTagId });
      setDeleteTagId(null);
    }
  }, [deleteTagId, deleteTag]);

  const handleMerge = useCallback(
    async (targetTagId: Id<"tags">) => {
      if (mergeSource && mergeSource !== targetTagId) {
        await mergeTags({ sourceTagId: mergeSource, targetTagId });
        setMergeSource(null);
      }
    },
    [mergeSource, mergeTags]
  );

  const handleColorChange = useCallback(
    async (tagId: Id<"tags">, color: string) => {
      await updateTagColor({ tagId, color: color || undefined });
    },
    [updateTagColor]
  );

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <span className="text-xl">🏷️</span>
              </div>
              <h2 className="text-lg font-bold text-white">Gestion des tags</h2>
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
            {mergeSource && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <p className="text-sm text-amber-300">
                  Mode fusion activé. Cliquez sur un tag pour y fusionner "
                  {tags.find((t) => t._id === mergeSource)?.name}".
                </p>
                <button
                  onClick={() => setMergeSource(null)}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300"
                >
                  Annuler
                </button>
              </div>
            )}

            {tags.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun tag pour le moment
              </p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => {
                  const fileCount = getTagFileCount(tag._id);
                  const isEditing = editingTagId === tag._id;

                  return (
                    <div
                      key={tag._id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        mergeSource === tag._id
                          ? "bg-amber-500/20 border border-amber-500/30"
                          : mergeSource
                            ? "bg-gray-800/50 hover:bg-emerald-500/20 cursor-pointer"
                            : "bg-gray-800/50 hover:bg-gray-800"
                      }`}
                      onClick={() => {
                        if (mergeSource && mergeSource !== tag._id) {
                          handleMerge(tag._id);
                        }
                      }}
                    >
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorPickerTagId(
                              colorPickerTagId === tag._id ? null : tag._id
                            );
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            backgroundColor: tag.color || "#10b981",
                          }}
                          aria-label="Changer la couleur"
                        >
                          <span className="text-white text-sm font-bold">#</span>
                        </button>
                        {colorPickerTagId === tag._id && (
                          <ColorPicker
                            selectedColor={tag.color}
                            onColorSelect={(color) =>
                              handleColorChange(tag._id, color)
                            }
                            onClose={() => setColorPickerTagId(null)}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(tag._id);
                              if (e.key === "Escape") {
                                setEditingTagId(null);
                                setEditingName("");
                              }
                            }}
                            onBlur={() => handleRename(tag._id)}
                            className="w-full bg-gray-900 text-white px-2 py-1 rounded text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="text-white font-medium truncate">
                            {tag.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {fileCount} fichier{fileCount !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {!mergeSource && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTagId(tag._id);
                              setEditingName(tag.name);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            aria-label="Renommer"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMergeSource(tag._id);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            aria-label="Fusionner"
                            title="Fusionner avec un autre tag"
                          >
                            🔗
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTagId(tag._id);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-red-900/50 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                            aria-label="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTagId !== null}
        title="Supprimer ce tag ?"
        message="Le tag sera supprimé de tous les fichiers associés. Cette action est irréversible."
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTagId(null)}
      />
    </>
  );
});
