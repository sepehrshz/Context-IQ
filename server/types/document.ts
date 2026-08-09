export interface DocumentFile {
  id: string;
  originalName: string;
  savedName: string;
  path: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
}
