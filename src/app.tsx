import { useState } from "react";
import { UploadSidebar } from "./components/uploadSidebar";
import { GraphView } from "./components/graphView";
import { FilePreview } from "./components/filePreview";
import { Id } from "../convex/_generated/dataModel";

function App() {
  const [selectedFileId, setSelectedFileId] = useState<Id<"files"> | null>(null);

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <UploadSidebar />
      <GraphView onFileSelect={setSelectedFileId} />

      {/* File preview modal */}
      {selectedFileId && (
        <FilePreview
          fileId={selectedFileId}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </div>
  );
}

export default App
