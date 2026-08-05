export interface DocumentFile {
  id: string;
  originalName: string;
  savedName: string;
  path: string;
  mimeType: string;
  size: number;
  hash: string;
  status: "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}
