export interface DocumentFile {
  id: string;
  originalName: string;
  savedName: string;
  path: string;
  mimeType: string;
  size: number;
  hash: string;
  status: "uploaded" | "parsing" | "parsed" | "chunking" | "chunked" | "failed";
  createdAt: string;
  updatedAt: string;
}
