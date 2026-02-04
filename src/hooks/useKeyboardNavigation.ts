import { useCallback, useEffect, useState } from "react";

interface UseKeyboardNavigationProps {
  nodes: { id: string; type: "file" | "tag" }[];
  adjacencyMap: Map<string, Set<string>>;
  onNodeSelect: (nodeId: string | null) => void;
  onOpenPreview: (nodeId: string) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  nodes,
  adjacencyMap,
  onNodeSelect,
  onOpenPreview,
  enabled = true,
}: UseKeyboardNavigationProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const getConnectedNodes = useCallback(
    (nodeId: string) => {
      const connected = adjacencyMap.get(nodeId);
      if (!connected) return [];
      return nodes.filter((n) => connected.has(n.id));
    },
    [adjacencyMap, nodes]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "Escape":
          setSelectedNodeId(null);
          onNodeSelect(null);
          break;

        case "Tab":
          e.preventDefault();
          if (nodes.length === 0) return;

          const newIndex = e.shiftKey
            ? (selectedIndex - 1 + nodes.length) % nodes.length
            : (selectedIndex + 1) % nodes.length;

          setSelectedIndex(newIndex);
          setSelectedNodeId(nodes[newIndex].id);
          onNodeSelect(nodes[newIndex].id);
          break;

        case "Enter":
          if (selectedNodeId) {
            const node = nodes.find((n) => n.id === selectedNodeId);
            if (node?.type === "file") {
              onOpenPreview(selectedNodeId);
            }
          }
          break;

        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          e.preventDefault();
          if (!selectedNodeId) {
            if (nodes.length > 0) {
              setSelectedNodeId(nodes[0].id);
              onNodeSelect(nodes[0].id);
            }
            return;
          }

          const connectedNodes = getConnectedNodes(selectedNodeId);
          if (connectedNodes.length === 0) return;

          const currentConnectedIndex = connectedNodes.findIndex(
            (n) => n.id === selectedNodeId
          );

          let nextIndex: number;
          if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            nextIndex =
              currentConnectedIndex === -1
                ? 0
                : (currentConnectedIndex + 1) % connectedNodes.length;
          } else {
            nextIndex =
              currentConnectedIndex === -1
                ? connectedNodes.length - 1
                : (currentConnectedIndex - 1 + connectedNodes.length) %
                  connectedNodes.length;
          }

          const nextNode = connectedNodes[nextIndex];
          if (nextNode) {
            setSelectedNodeId(nextNode.id);
            onNodeSelect(nextNode.id);

            const globalIndex = nodes.findIndex((n) => n.id === nextNode.id);
            if (globalIndex !== -1) {
              setSelectedIndex(globalIndex);
            }
          }
          break;
      }
    },
    [
      enabled,
      nodes,
      selectedNodeId,
      selectedIndex,
      onNodeSelect,
      onOpenPreview,
      getConnectedNodes,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedNodeId,
    setSelectedNodeId,
  };
}
