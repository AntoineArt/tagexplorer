import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { UploadSidebar } from "./components/uploadSidebar";
import { GraphView } from "./components/graphView";
import { FilePreview } from "./components/filePreview";
import { SearchBar } from "./components/searchBar";
import { TagManager } from "./components/tagManager";
import { TrashView } from "./components/trashView";
import { AICostIndicator } from "./components/aiCostIndicator";
import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { exportToJSON, exportToCSV } from "./utils/export";

function App() {
  const [selectedFileId, setSelectedFileId] = useState<Id<"files"> | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // @ts-expect-error - config module will be available after convex codegen
  const apiKeyStatus = useQuery(api.config?.checkApiKey ?? "skip");
  const files = useQuery(api.files.listFiles) ?? [];
  const tags = useQuery(api.tags.listTags) ?? [];
  const fileTags = useQuery(api.tags.listFileTags) ?? [];
  const deletedFiles = useQuery(api.files.listDeletedFiles) ?? [];

  const handleSelectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId as Id<"files">);
  }, []);

  const handleSelectTag = useCallback((_tagId: string) => {
    // Future: could highlight the tag in the graph or filter files
  }, []);

  const handleExportJSON = useCallback(() => {
    exportToJSON(files, tags, fileTags);
    setShowExportMenu(false);
  }, [files, tags, fileTags]);

  const handleExportCSV = useCallback(() => {
    exportToCSV(files, tags, fileTags);
    setShowExportMenu(false);
  }, [files, tags, fileTags]);

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* API Key Warning Banner */}
      {apiKeyStatus && !apiKeyStatus.configured && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-950/90 border-b border-amber-500/30 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <span className="text-amber-400">⚠️</span>
            <p className="text-amber-200 text-sm">
              Clé API AI Gateway non configurée. L'analyse automatique des fichiers ne fonctionnera pas.
            </p>
            <a
              href="https://vercel.com/dashboard/ai-gateway/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-2"
            >
              Configurer
            </a>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="fixed top-4 left-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setShowTagManager(true)}
          className="glass-light px-3 py-2 rounded-xl flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          title="Gérer les tags"
          aria-label="Gérer les tags"
        >
          <span>🏷️</span>
          <span className="text-sm hidden sm:inline">Tags</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="glass-light px-3 py-2 rounded-xl flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            title="Exporter"
            aria-label="Exporter"
          >
            <span>📤</span>
            <span className="text-sm hidden sm:inline">Exporter</span>
          </button>

          {showExportMenu && (
            <div className="absolute top-full left-0 mt-2 glass rounded-xl overflow-hidden shadow-xl z-50">
              <button
                onClick={handleExportJSON}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span>📄</span> JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span>📊</span> CSV
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowTrash(true)}
          className="glass-light px-3 py-2 rounded-xl flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          title="Corbeille"
          aria-label="Corbeille"
        >
          <span>🗑️</span>
          {deletedFiles.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full">
              {deletedFiles.length}
            </span>
          )}
        </button>

        <AICostIndicator />
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowExportMenu(false)}
        />
      )}

      {/* Main content */}
      <UploadSidebar />
      <GraphView onFileSelect={setSelectedFileId} />

      {/* Global search (Cmd+K) */}
      <SearchBar
        files={files}
        tags={tags}
        onSelectFile={handleSelectFile}
        onSelectTag={handleSelectTag}
      />

      {/* File preview modal */}
      {selectedFileId && (
        <FilePreview
          fileId={selectedFileId}
          onClose={() => setSelectedFileId(null)}
        />
      )}

      {/* Tag manager modal */}
      <TagManager
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
      />

      {/* Trash view modal */}
      <TrashView isOpen={showTrash} onClose={() => setShowTrash(false)} />
    </div>
  );
}

export default App
