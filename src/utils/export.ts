interface FileData {
  _id: string;
  name: string;
  type: string;
  size?: number;
  createdAt: number;
}

interface TagData {
  _id: string;
  name: string;
  color?: string;
}

interface FileTagData {
  fileId: string;
  tagId: string;
}

interface ExportData {
  exportedAt: string;
  files: FileData[];
  tags: TagData[];
  fileTags: FileTagData[];
}

export function exportToJSON(
  files: FileData[],
  tags: TagData[],
  fileTags: FileTagData[]
): void {
  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    files,
    tags,
    fileTags,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  downloadBlob(blob, `tagexplorer-export-${formatDate()}.json`);
}

export function exportToCSV(
  files: FileData[],
  tags: TagData[],
  fileTags: FileTagData[]
): void {
  const tagMap = new Map(tags.map((t) => [t._id, t.name]));

  const rows = files.map((file) => {
    const fileTagIds = fileTags
      .filter((ft) => ft.fileId === file._id)
      .map((ft) => ft.tagId);
    const tagNames = fileTagIds
      .map((id) => tagMap.get(id))
      .filter(Boolean)
      .join("; ");

    return {
      name: file.name,
      type: file.type,
      size: file.size ?? "",
      createdAt: new Date(file.createdAt).toISOString(),
      tags: tagNames,
    };
  });

  const headers = ["name", "type", "size", "createdAt", "tags"];
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const value = row[h as keyof typeof row];
          const stringValue = String(value ?? "");
          return stringValue.includes(",") || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `tagexplorer-export-${formatDate()}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
