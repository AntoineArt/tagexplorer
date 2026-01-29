import { useState, useCallback, useRef } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DropZone } from "./dropZone";
import { TagChip } from "./tagChip";
import { TagInput } from "./tagInput";

interface PendingFile {
  file: File;
  preview: string;
  storageId: string;
  existingTags: string[];
  newTags: string[];
  selectedTags: Set<string>;
  suggestedName: string | null;
  customName: string | null;
}

const MIN_WIDTH = 360;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 420;

export function UploadSidebar() {
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);

  const allTags = useQuery(api.tags.listTags) ?? [];
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const bulkLinkFileTags = useMutation(api.tags.bulkLinkFileTags);
  const analyzeFile = useAction(api.analyze.analyzeFile);

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleFileDrop = useCallback(async (file: File) => {
    setError(null);
    setIsAnalyzing(true);

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      const existingTagNames = allTags.map(t => t.name);
      const analysis = await analyzeFile({
        storageId,
        fileType: file.type,
        fileName: file.name,
        existingTags: existingTagNames,
      });

      const allSuggested = [...analysis.existingTags, ...analysis.newTags];
      setPendingFile({
        file,
        preview,
        storageId,
        existingTags: analysis.existingTags,
        newTags: analysis.newTags,
        selectedTags: new Set(allSuggested),
        suggestedName: analysis.suggestedName,
        customName: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      if (preview) URL.revokeObjectURL(preview);
    } finally {
      setIsAnalyzing(false);
    }
  }, [generateUploadUrl, analyzeFile]);

  const toggleTag = useCallback((tagName: string) => {
    if (!pendingFile) return;

    const newSelected = new Set(pendingFile.selectedTags);
    if (newSelected.has(tagName)) {
      newSelected.delete(tagName);
    } else {
      newSelected.add(tagName);
    }

    setPendingFile({
      ...pendingFile,
      selectedTags: newSelected,
    });
  }, [pendingFile]);

  const addManualTag = useCallback((tagName: string) => {
    if (!pendingFile) return;

    const allCurrent = [...pendingFile.existingTags, ...pendingFile.newTags];
    if (allCurrent.includes(tagName)) return;

    const existingTagNames = allTags.map(t => t.name);
    const isExisting = existingTagNames.includes(tagName);

    const newSelected = new Set(pendingFile.selectedTags);
    newSelected.add(tagName);

    setPendingFile({
      ...pendingFile,
      existingTags: isExisting ? [...pendingFile.existingTags, tagName] : pendingFile.existingTags,
      newTags: isExisting ? pendingFile.newTags : [...pendingFile.newTags, tagName],
      selectedTags: newSelected,
    });
  }, [pendingFile, allTags]);

  const handleValidate = useCallback(async () => {
    if (!pendingFile) return;

    try {
      const fileName = pendingFile.customName ?? pendingFile.suggestedName ?? pendingFile.file.name;
      const fileId = await saveFile({
        storageId: pendingFile.storageId as `_storage/${string}`,
        name: fileName,
        type: pendingFile.file.type,
      });

      await bulkLinkFileTags({
        fileId,
        tagNames: [...pendingFile.selectedTags],
      });

      if (pendingFile.preview) URL.revokeObjectURL(pendingFile.preview);
      setPendingFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
  }, [pendingFile, saveFile, bulkLinkFileTags]);

  const handleCancel = useCallback(() => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
    setError(null);
  }, [pendingFile]);

  return (
    <div
      className="relative flex-shrink-0 flex glass"
      style={{ width }}
    >
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl">🏷️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TagExplorer
              </h1>
              <p className="text-xs text-gray-500">Organisez par tags intelligents</p>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <DropZone
          onFileDrop={handleFileDrop}
          disabled={isAnalyzing || pendingFile !== null}
        />

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="glass-light rounded-2xl p-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-spin-slow opacity-20"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-spin-slow opacity-40" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                🤖
              </div>
            </div>
            <p className="text-white font-medium">Analyse en cours...</p>
            <p className="text-gray-500 text-sm mt-1">L'IA examine votre fichier</p>
            <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-shimmer"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="relative rounded-2xl p-4 bg-red-950/30 border border-red-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
            <div className="relative flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-red-400 font-medium">Erreur</p>
                <p className="text-red-300/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending File */}
        {pendingFile && (
          <div className="glass-light rounded-2xl p-5 space-y-5">
            {/* File Preview */}
            <div className="flex items-start gap-4">
              {pendingFile.preview ? (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-30 blur group-hover:opacity-50 transition"></div>
                  <img
                    src={pendingFile.preview}
                    alt=""
                    className="relative w-24 h-24 object-cover rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-4xl shadow-inner">
                  📄
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-white truncate">{pendingFile.file.name}</p>
                <p className="text-sm text-gray-400">
                  {(pendingFile.file.size / 1024).toFixed(1)} KB
                </p>
                <span className="inline-block px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                  {pendingFile.file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
              </div>
            </div>

            {/* Rename suggestion */}
            {pendingFile.suggestedName && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300">Renommer le fichier</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-950/30 border border-blue-500/20">
                  <span className="text-blue-400 text-sm">✏️</span>
                  <input
                    type="text"
                    defaultValue={pendingFile.customName ?? pendingFile.suggestedName}
                    onChange={(e) => setPendingFile({ ...pendingFile, customName: e.target.value || null })}
                    className="flex-1 bg-transparent text-sm text-white outline-none"
                  />
                  <button
                    onClick={() => setPendingFile({ ...pendingFile, suggestedName: null, customName: null })}
                    className="text-gray-500 hover:text-gray-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-300">Tags suggérés</p>
                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                  {pendingFile.selectedTags.size} sélectionnés
                </span>
              </div>

              {pendingFile.existingTags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Tags existants</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingFile.existingTags.map((tag) => (
                      <TagChip
                        key={tag}
                        name={tag}
                        selected={pendingFile.selectedTags.has(tag)}
                        onToggle={() => toggleTag(tag)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {pendingFile.newTags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Nouveaux tags</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingFile.newTags.map((tag) => (
                      <TagChip
                        key={tag}
                        name={tag}
                        selected={pendingFile.selectedTags.has(tag)}
                        onToggle={() => toggleTag(tag)}
                        isNew
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Manual Tag Input */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300">Ajouter un tag</p>
              <TagInput
                onAddTag={addManualTag}
                existingTags={[...pendingFile.existingTags, ...pendingFile.newTags]}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all font-medium text-gray-300 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleValidate}
                disabled={pendingFile.selectedTags.size === 0}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all font-medium text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Valider ✓
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize group"
      >
        <div className="h-full w-full bg-transparent group-hover:bg-gradient-to-b group-hover:from-transparent group-hover:via-emerald-500/50 group-hover:to-transparent transition-all duration-300"></div>
      </div>
    </div>
  );
}
