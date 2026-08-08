import { chunkText } from "../utils/chunk.ts";

export interface DocumentChunk {
  content: string;
  index: number;
}

export function createDocumentChunks(
  content: string,
  chunkSize = 500,
  overlap = 100,
): DocumentChunk[] {
  if (!content.trim()) {
    return [];
  }

  const chunks = chunkText(content, chunkSize, overlap);

  return chunks.map((content, index) => ({
    content,
    index,
  }));
}
