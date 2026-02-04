import { useMemo, useCallback, useRef, useEffect, memo, useState } from "react";
import { useQuery } from "convex/react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useGraphControls } from "../hooks/useGraphControls";
import { GraphControls } from "./graphControls";
import { GraphSearchBar } from "./graphSearchBar";
import { GraphSettings } from "./graphSettings";

interface GraphNode {
  id: string;
  type: "file" | "tag";
  name: string;
  fileId?: Id<"files">;
  tagId?: Id<"tags">;
  storageId?: Id<"_storage">;
  color?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphViewProps {
  onFileSelect: (fileId: Id<"files">) => void;
}

export const GraphView = memo(function GraphView({ onFileSelect }: GraphViewProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [_searchQuery, setSearchQuery] = useState("");
  const [searchHighlightedIds, setSearchHighlightedIds] = useState<string[]>([]);
  const [chargeStrength, setChargeStrength] = useState(-60);
  const [linkDistance, setLinkDistance] = useState(50);

  const files = useQuery(api.files.listFiles) ?? [];
  const tags = useQuery(api.tags.listTags) ?? [];
  const fileTags = useQuery(api.tags.listFileTags) ?? [];

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [
      ...files.map((f) => ({
        id: `file:${f._id}`,
        type: "file" as const,
        name: f.name,
        fileId: f._id,
        storageId: f.storageId,
      })),
      ...tags.map((t) => ({
        id: `tag:${t._id}`,
        type: "tag" as const,
        name: t.name,
        tagId: t._id,
        color: t.color,
      })),
    ];

    const links: GraphLink[] = fileTags.map((ft) => ({
      source: `file:${ft.fileId}`,
      target: `tag:${ft.tagId}`,
    }));

    return { nodes, links };
  }, [files, tags, fileTags]);

  const linksForControls = useMemo(() => {
    return fileTags.map((ft) => ({
      source: `file:${ft.fileId}`,
      target: `tag:${ft.tagId}`,
    }));
  }, [fileTags]);

  const {
    zoomLevel,
    hoveredNodeId,
    handleZoom,
    handleNodeHover,
    getNodeOpacity,
    getLinkOpacity,
    isNodeHighlighted,
  } = useGraphControls(linksForControls);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === "file" && node.fileId) {
        onFileSelect(node.fileId);
      }
    },
    [onFileSelect]
  );

  const handleNodeDoubleClick = useCallback(
    (node: GraphNode) => {
      if (graphRef.current && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 300);
        graphRef.current.zoom(2, 300);
      }
    },
    []
  );

  const handleNodeDragEnd = useCallback((node: GraphNode) => {
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const handleBackgroundClick = useCallback(() => {
    handleNodeHover(null);
  }, [handleNodeHover]);

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(Math.min(currentZoom * 1.5, 8), 200);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(Math.max(currentZoom / 1.5, 0.5), 200);
    }
  }, []);

  const handleFitToView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, []);

  const handleCenterNode = useCallback((nodeId: string) => {
    const node = graphData.nodes.find((n) => n.id === nodeId);
    if (graphRef.current && node && node.x !== undefined && node.y !== undefined) {
      graphRef.current.centerAt(node.x, node.y, 400);
      graphRef.current.zoom(1.5, 400);
    }
  }, [graphData.nodes]);

  const nodesForSearch = useMemo(
    () =>
      graphData.nodes.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
      })),
    [graphData.nodes]
  );

  const handleChargeStrengthChange = useCallback((value: number) => {
    setChargeStrength(value);
    if (graphRef.current) {
      graphRef.current.d3Force("charge")?.strength(value);
      graphRef.current.d3ReheatSimulation();
    }
  }, []);

  const handleLinkDistanceChange = useCallback((value: number) => {
    setLinkDistance(value);
    if (graphRef.current) {
      graphRef.current.d3Force("link")?.distance(value);
      graphRef.current.d3ReheatSimulation();
    }
  }, []);

  const nodeCanvasObject = useCallback(
    (
      node: GraphNode,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const label = node.name;
      const fontSize = Math.max(10 / globalScale, 3);
      const opacity = getNodeOpacity(node.id);
      const isHighlighted = isNodeHighlighted(node.id);
      const isHovered = hoveredNodeId === node.id;
      const isSearchHighlighted = searchHighlightedIds.includes(node.id);

      ctx.globalAlpha = opacity;

      if (node.type === "file") {
        const baseSize = 12;
        const size = isHovered ? baseSize * 1.2 : baseSize;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
        if (isHighlighted && hoveredNodeId) {
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
        } else {
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
        ctx.fill();

        const mainGradient = ctx.createRadialGradient(
          x - size / 3,
          y - size / 3,
          0,
          x,
          y,
          size
        );
        mainGradient.addColorStop(0, "#60a5fa");
        mainGradient.addColorStop(1, "#3b82f6");
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        if (isHovered || isSearchHighlighted) {
          ctx.strokeStyle = isSearchHighlighted
            ? "rgba(251, 191, 36, 1)"
            : "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = (isSearchHighlighted ? 3 : 2) / globalScale;
          ctx.stroke();
        }

        ctx.fillStyle = "white";
        ctx.font = `${size}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📄", x, y);
      } else {
        const baseSize = 8;
        const size = isHovered ? baseSize * 1.2 : baseSize;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
        if (isHighlighted && hoveredNodeId) {
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.5)");
          gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
        } else {
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
          gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
        ctx.fill();

        const mainGradient = ctx.createRadialGradient(
          x - size / 3,
          y - size / 3,
          0,
          x,
          y,
          size
        );
        mainGradient.addColorStop(0, "#34d399");
        mainGradient.addColorStop(1, "#10b981");
        ctx.fillStyle = node.color || mainGradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        if (isHovered || isSearchHighlighted) {
          ctx.strokeStyle = isSearchHighlighted
            ? "rgba(251, 191, 36, 1)"
            : "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = (isSearchHighlighted ? 3 : 2) / globalScale;
          ctx.stroke();
        }

        ctx.fillStyle = "white";
        ctx.font = `bold ${size * 1.2}px Sans-Serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("#", x, y);
      }

      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * opacity})`;
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const maxLength = 20;
      const displayLabel =
        label.length > maxLength ? label.slice(0, maxLength) + "..." : label;

      const textWidth = ctx.measureText(displayLabel).width;
      const padding = 4 / globalScale;
      const labelY = y + (node.type === "file" ? 16 : 12);

      ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * opacity})`;
      ctx.beginPath();
      ctx.roundRect(
        x - textWidth / 2 - padding,
        labelY - padding / 2,
        textWidth + padding * 2,
        fontSize + padding,
        3 / globalScale
      );
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * opacity})`;
      ctx.fillText(displayLabel, x, labelY);

      ctx.globalAlpha = 1;
    },
    [getNodeOpacity, isNodeHighlighted, hoveredNodeId, searchHighlightedIds]
  );

  const linkCanvasObject = useCallback(
    (
      link: GraphLink,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const sourceNode = link.source as GraphNode;
      const targetNode = link.target as GraphNode;

      if (
        sourceNode.x === undefined ||
        sourceNode.y === undefined ||
        targetNode.x === undefined ||
        targetNode.y === undefined
      ) {
        return;
      }

      const opacity = getLinkOpacity(sourceNode.id, targetNode.id);
      const isHighlighted = opacity === 1 && hoveredNodeId !== null;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);

      if (isHighlighted) {
        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
        ctx.lineWidth = 2.5 / globalScale;
      } else {
        ctx.strokeStyle = `rgba(75, 85, 99, ${opacity})`;
        ctx.lineWidth = 1.5 / globalScale;
      }

      ctx.stroke();
    },
    [getLinkOpacity, hoveredNodeId]
  );

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge")?.strength(-60);
      graphRef.current.d3Force("link")?.distance(50);
    }
  }, []);

  if (files.length === 0 && tags.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center max-w-md px-8">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-3xl blur-2xl"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl border border-gray-700/30 flex items-center justify-center backdrop-blur">
              <span className="text-6xl">📊</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Votre graphe est vide
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Glissez un fichier dans la zone à gauche pour commencer. L'IA
            analysera automatiquement son contenu et suggérera des tags
            pertinents.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Fichiers
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Tags
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-950 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-950 to-transparent"></div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-3">
        <div className="glass-light px-4 py-2 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-sm text-gray-400">{files.length} fichiers</span>
        </div>
        <div className="glass-light px-4 py-2 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-sm text-gray-400">{tags.length} tags</span>
        </div>
      </div>

      <GraphSearchBar
        nodes={nodesForSearch}
        onSearch={setSearchQuery}
        onHighlight={setSearchHighlightedIds}
        onCenterNode={handleCenterNode}
      />

      <GraphSettings
        chargeStrength={chargeStrength}
        linkDistance={linkDistance}
        onChargeStrengthChange={handleChargeStrengthChange}
        onLinkDistanceChange={handleLinkDistanceChange}
      />

      <GraphControls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToView={handleFitToView}
      />

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeDoubleClick}
        onNodeHover={(node) => handleNodeHover(node?.id ?? null)}
        onNodeDragEnd={handleNodeDragEnd}
        onBackgroundClick={handleBackgroundClick}
        onZoom={({ k }) => handleZoom(k)}
        linkColor={() => "transparent"}
        linkWidth={0}
        backgroundColor="#030712"
        minZoom={0.5}
        maxZoom={8}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        nodePointerAreaPaint={(node, color, ctx) => {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          const size = node.type === "file" ? 16 : 12;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fill();
        }}
      />
    </div>
  );
});
