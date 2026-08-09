import { searchDocuments } from "./retrieval.service";

export interface RetrievedContext {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  index: number;
}

export async function buildContext(query: string, limit = 5) {
  const results = await searchDocuments(query, limit);

  return results
    .filter((result) => result.score >= 0.45)
    .map((result) => ({
      chunkId: result.payload?.chunkId as string,
      documentId: result.payload?.documentId as string,
      content: result.payload?.content as string,
      score: result.score,
      index: result.payload?.index as number,
    }));
}
