import { useState, useEffect, useCallback, useRef, memo } from "react";

interface GraphSearchBarProps {
  nodes: { id: string; name: string; type: "file" | "tag" }[];
  onSearch: (query: string) => void;
  onHighlight: (nodeIds: string[]) => void;
  onCenterNode: (nodeId: string) => void;
}

export const GraphSearchBar = memo(function GraphSearchBar({
  nodes,
  onSearch,
  onHighlight,
  onCenterNode,
}: GraphSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredNodes = query.trim()
    ? nodes.filter((node) =>
        node.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        onHighlight([]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onHighlight]);

  useEffect(() => {
    if (query.trim()) {
      const matchingIds = filteredNodes.map((n) => n.id);
      onHighlight(matchingIds);
      onSearch(query);
    } else {
      onHighlight([]);
      onSearch("");
    }
    setSelectedIndex(0);
  }, [query, filteredNodes.length, onHighlight, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredNodes.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredNodes[selectedIndex]) {
        e.preventDefault();
        onCenterNode(filteredNodes[selectedIndex].id);
      }
    },
    [filteredNodes, selectedIndex, onCenterNode]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    onHighlight([]);
  }, [onHighlight]);

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20 glass-light px-4 py-2 rounded-xl flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Rechercher dans le graphe"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="text-sm">Rechercher</span>
        <kbd className="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">
          ⌘F
        </kbd>
      </button>
    );
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-80">
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
            autoFocus
          />
          {query && (
            <span className="text-xs text-gray-500">
              {filteredNodes.length} résultat{filteredNodes.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer la recherche"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {filteredNodes.length > 0 && (
          <div className="border-t border-gray-700/50 max-h-64 overflow-y-auto">
            {filteredNodes.slice(0, 10).map((node, index) => (
              <button
                key={node.id}
                onClick={() => onCenterNode(node.id)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-emerald-500/20 text-white"
                    : "hover:bg-white/5 text-gray-300"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    node.type === "file"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {node.type === "file" ? "📄" : "#"}
                </span>
                <span className="text-sm truncate">{node.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
