import { useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphViewProps {
  onFileSelect: (fileId: Id<"files">) => void;
}

export function GraphView({ onFileSelect }: GraphViewProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>();

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

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.type === "file" && node.fileId) {
      onFileSelect(node.fileId);
    }
  }, [onFileSelect]);

  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const label = node.name;
    const fontSize = Math.max(10 / globalScale, 3);

    if (node.type === "file") {
      // File node - larger, blue gradient
      const size = 12;

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
      ctx.fill();

      // Main circle
      const mainGradient = ctx.createRadialGradient(x - size/3, y - size/3, 0, x, y, size);
      mainGradient.addColorStop(0, "#60a5fa");
      mainGradient.addColorStop(1, "#3b82f6");
      ctx.fillStyle = mainGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();

      // Icon
      ctx.fillStyle = "white";
      ctx.font = `${size}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📄", x, y);
    } else {
      // Tag node - smaller, emerald gradient
      const size = 8;

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.3)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
      ctx.fill();

      // Main circle
      const mainGradient = ctx.createRadialGradient(x - size/3, y - size/3, 0, x, y, size);
      mainGradient.addColorStop(0, "#34d399");
      mainGradient.addColorStop(1, "#10b981");
      ctx.fillStyle = node.color || mainGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();

      // Hash icon
      ctx.fillStyle = "white";
      ctx.font = `bold ${size * 1.2}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("#", x, y);
    }

    // Label
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const maxLength = 20;
    const displayLabel = label.length > maxLength
      ? label.slice(0, maxLength) + "..."
      : label;

    // Label background
    const textWidth = ctx.measureText(displayLabel).width;
    const padding = 4 / globalScale;
    const labelY = y + (node.type === "file" ? 16 : 12);

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.roundRect(
      x - textWidth / 2 - padding,
      labelY - padding / 2,
      textWidth + padding * 2,
      fontSize + padding,
      3 / globalScale
    );
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(displayLabel, x, labelY);
  }, []);

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
          <h2 className="text-2xl font-bold text-white mb-3">Votre graphe est vide</h2>
          <p className="text-gray-500 leading-relaxed">
            Glissez un fichier dans la zone à gauche pour commencer.
            L'IA analysera automatiquement son contenu et suggérera des tags pertinents.
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
    <div className="flex-1 relative overflow-hidden">
      {/* Gradient overlay at edges */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-950 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-950 to-transparent"></div>
      </div>

      {/* Stats overlay */}
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

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        onNodeClick={handleNodeClick}
        linkColor={() => "rgba(75, 85, 99, 0.5)"}
        linkWidth={1.5}
        backgroundColor="#030712"
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
}
