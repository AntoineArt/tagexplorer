import { useState, useCallback, memo } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface QueueItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "analyzing" | "ready" | "saving" | "done" | "error";
  error?: string;
  storageId?: string;
  existingTags: string[];
  newTags: string[];
  selectedTags: Set<string>;
  suggestedName: string | null;
}

interface UploadQueueProps {
  files: File[];
  onComplete: () => void;
  onCancel: () => void;
}

export const UploadQueue = memo(function UploadQueue({
  files,
  onComplete,
  onCancel,
}: UploadQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    files.map((file, index) => ({
      id: `${file.name}-${index}`,
      file,
      status: "pending",
      existingTags: [],
      newTags: [],
      selectedTags: new Set<string>(),
      suggestedName: null,
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const allTags = useQuery(api.tags.listTags) ?? [];
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const bulkLinkFileTags = useMutation(api.tags.bulkLinkFileTags);
  const analyzeFile = useAction(api.analyze.analyzeFile);

  const processFile = useCallback(
    async (item: QueueItem, index: number) => {
      setQueue((prev) =>
        prev.map((q, i) => (i === index ? { ...q, status: "uploading" } : q))
      );

      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": item.file.type },
          body: item.file,
        });

        if (!result.ok) throw new Error("Upload failed");

        const { storageId } = await result.json();

        setQueue((prev) =>
          prev.map((q, i) =>
            i === index ? { ...q, status: "analyzing", storageId } : q
          )
        );

        const existingTagNames = allTags.map((t) => t.name);
        const analysis = await analyzeFile({
          storageId,
          fileType: item.file.type,
          fileName: item.file.name,
          existingTags: existingTagNames,
        });

        const allSuggested = [...analysis.existingTags, ...analysis.newTags];

        setQueue((prev) =>
          prev.map((q, i) =>
            i === index
              ? {
                  ...q,
                  status: "ready",
                  existingTags: analysis.existingTags,
                  newTags: analysis.newTags,
                  selectedTags: new Set(allSuggested),
                  suggestedName: analysis.suggestedName,
                }
              : q
          )
        );
      } catch (error) {
        setQueue((prev) =>
          prev.map((q, i) =>
            i === index
              ? {
                  ...q,
                  status: "error",
                  error: error instanceof Error ? error.message : "Erreur inconnue",
                }
              : q
          )
        );
      }
    },
    [generateUploadUrl, analyzeFile, allTags]
  );

  const startProcessing = useCallback(async () => {
    setIsProcessing(true);

    for (let i = 0; i < queue.length; i++) {
      setCurrentIndex(i);
      if (queue[i].status === "pending") {
        await processFile(queue[i], i);
      }
    }

    setIsProcessing(false);
  }, [queue, processFile]);

  const toggleTag = useCallback((itemId: string, tagName: string) => {
    setQueue((prev) =>
      prev.map((q) => {
        if (q.id !== itemId) return q;
        const newSelected = new Set(q.selectedTags);
        if (newSelected.has(tagName)) {
          newSelected.delete(tagName);
        } else {
          newSelected.add(tagName);
        }
        return { ...q, selectedTags: newSelected };
      })
    );
  }, []);

  const saveAll = useCallback(async () => {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status !== "ready" || !item.storageId) continue;

      setQueue((prev) =>
        prev.map((q, idx) => (idx === i ? { ...q, status: "saving" } : q))
      );

      try {
        const fileName = item.suggestedName ?? item.file.name;
        const fileId = await saveFile({
          storageId: item.storageId as Id<"_storage">,
          name: fileName,
          type: item.file.type,
          size: item.file.size,
        });

        await bulkLinkFileTags({
          fileId,
          tagNames: [...item.selectedTags],
        });

        setQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: "done" } : q))
        );
      } catch (error) {
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: "error",
                  error: error instanceof Error ? error.message : "Erreur sauvegarde",
                }
              : q
          )
        );
      }
    }

    onComplete();
  }, [queue, saveFile, bulkLinkFileTags, onComplete]);

  const readyCount = queue.filter((q) => q.status === "ready").length;
  const doneCount = queue.filter((q) => q.status === "done").length;

  const getStatusIcon = (status: QueueItem["status"]) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "uploading":
      case "analyzing":
      case "saving":
        return "🔄";
      case "ready":
        return "✅";
      case "done":
        return "✓";
      case "error":
        return "❌";
    }
  };

  const getStatusLabel = (status: QueueItem["status"]) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "uploading":
        return "Upload...";
      case "analyzing":
        return "Analyse IA...";
      case "ready":
        return "Prêt";
      case "saving":
        return "Sauvegarde...";
      case "done":
        return "Terminé";
      case "error":
        return "Erreur";
    }
  };

  return (
    <div className="glass-light rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Upload groupé ({doneCount}/{queue.length})
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white text-sm"
        >
          Annuler
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl transition-colors ${
              index === currentIndex && isProcessing
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getStatusIcon(item.status)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.file.name}</p>
                <p className="text-xs text-gray-500">
                  {getStatusLabel(item.status)}
                  {item.error && ` - ${item.error}`}
                </p>
              </div>
              {item.status === "ready" && (
                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                  {item.selectedTags.size} tags
                </span>
              )}
            </div>

            {item.status === "ready" && (
              <div className="mt-2 flex flex-wrap gap-1">
                {[...item.existingTags, ...item.newTags].slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(item.id, tag)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-all ${
                      item.selectedTags.has(tag)
                        ? "bg-emerald-500/30 text-emerald-300"
                        : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        {!isProcessing && readyCount === 0 && doneCount === 0 && (
          <button
            onClick={startProcessing}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
          >
            Analyser tout
          </button>
        )}
        {readyCount > 0 && (
          <button
            onClick={saveAll}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
          >
            Valider tout ({readyCount})
          </button>
        )}
      </div>
    </div>
  );
});
