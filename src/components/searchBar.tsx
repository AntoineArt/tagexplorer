import { useState, useEffect, useCallback, useRef, memo } from "react";

interface SearchResult {
  id: string;
  name: string;
  type: "file" | "tag";
}

interface SearchBarProps {
  files: { _id: string; name: string }[];
  tags: { _id: string; name: string }[];
  onSelectFile: (fileId: string) => void;
  onSelectTag: (tagId: string) => void;
}

export const SearchBar = memo(function SearchBar({
  files,
  tags,
  onSelectFile,
  onSelectTag,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results: SearchResult[] = query.trim()
    ? [
        ...files
          .filter((f) =>
            f.name.toLowerCase().includes(query.toLowerCase())
          )
          .map((f) => ({ id: f._id, name: f.name, type: "file" as const })),
        ...tags
          .filter((t) =>
            t.name.toLowerCase().includes(query.toLowerCase())
          )
          .map((t) => ({ id: t._id, name: t.name, type: "tag" as const })),
      ]
    : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    },
    [results, selectedIndex]
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === "file") {
        onSelectFile(result.id);
      } else {
        onSelectTag(result.id);
      }
      setIsOpen(false);
      setQuery("");
    },
    [onSelectFile, onSelectTag]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-32"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl glass rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un fichier ou tag..."
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-gray-500"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded border border-gray-700">
            ESC
          </kbd>
        </div>

        {results.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {results.slice(0, 15).map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className={`w-full px-5 py-3 flex items-center gap-4 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-emerald-500/20"
                    : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    result.type === "file"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {result.type === "file" ? "📄" : "#"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {result.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.type === "file" ? "Fichier" : "Tag"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="px-5 py-8 text-center text-gray-500">
            <p>Aucun résultat pour "{query}"</p>
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-gray-500">
            <p>Tapez pour rechercher...</p>
          </div>
        )}
      </div>
    </div>
  );
});
