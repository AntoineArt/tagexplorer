import { useState, useCallback, useMemo } from "react";

export interface GraphControlsState {
  zoomLevel: number;
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  highlightedNodes: Set<string>;
  highlightedLinks: Set<string>;
}

interface GraphLink {
  source: string;
  target: string;
}

export function useGraphControls(links: GraphLink[]) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    links.forEach((link) => {
      const sourceId = typeof link.source === "string" ? link.source : (link.source as { id: string }).id;
      const targetId = typeof link.target === "string" ? link.target : (link.target as { id: string }).id;

      if (!map.has(sourceId)) map.set(sourceId, new Set());
      if (!map.has(targetId)) map.set(targetId, new Set());
      map.get(sourceId)!.add(targetId);
      map.get(targetId)!.add(sourceId);
    });
    return map;
  }, [links]);

  const { highlightedNodes, highlightedLinks } = useMemo(() => {
    const nodes = new Set<string>();
    const linkSet = new Set<string>();

    if (hoveredNodeId) {
      nodes.add(hoveredNodeId);
      const neighbors = adjacencyMap.get(hoveredNodeId);
      if (neighbors) {
        neighbors.forEach((neighbor) => {
          nodes.add(neighbor);
          linkSet.add(`${hoveredNodeId}-${neighbor}`);
          linkSet.add(`${neighbor}-${hoveredNodeId}`);
        });
      }
    }

    return { highlightedNodes: nodes, highlightedLinks: linkSet };
  }, [hoveredNodeId, adjacencyMap]);

  const handleZoom = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const getNodeOpacity = useCallback(
    (nodeId: string) => {
      if (!hoveredNodeId) return 1;
      if (highlightedNodes.has(nodeId)) return 1;
      return 0.3;
    },
    [hoveredNodeId, highlightedNodes]
  );

  const getLinkOpacity = useCallback(
    (sourceId: string, targetId: string) => {
      if (!hoveredNodeId) return 0.5;
      if (
        highlightedLinks.has(`${sourceId}-${targetId}`) ||
        highlightedLinks.has(`${targetId}-${sourceId}`)
      ) {
        return 1;
      }
      return 0.1;
    },
    [hoveredNodeId, highlightedLinks]
  );

  const isNodeHighlighted = useCallback(
    (nodeId: string) => {
      return highlightedNodes.has(nodeId);
    },
    [highlightedNodes]
  );

  return {
    zoomLevel,
    hoveredNodeId,
    selectedNodeId,
    highlightedNodes,
    highlightedLinks,
    handleZoom,
    handleNodeHover,
    handleNodeSelect,
    getNodeOpacity,
    getLinkOpacity,
    isNodeHighlighted,
    adjacencyMap,
  };
}
