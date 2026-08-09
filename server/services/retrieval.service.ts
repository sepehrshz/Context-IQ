import { generateEmbeddings } from "./embedding.service";
import { searchSimilarChunks } from "./vector.service";

export async function searchDocuments(query: string, limit = 5) {
  const embeddings = await generateEmbeddings([query]);

  const queryVector = embeddings[0];

  if (!queryVector) {
    throw new Error("Failed to generate query embedding.");
  }

  const results = await searchSimilarChunks(queryVector, limit);

  return results;
}
