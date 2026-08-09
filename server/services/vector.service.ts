import { qdrant, QDRANT_COLLECTION } from "../../server/utils/qdrant";

export interface ChunkVector {
  id: string;
  vector: number[];
  content: string;
  documentId: string;
  index: number;
}

export async function initVectorCollection() {
  const collections = await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) => collection.name === QDRANT_COLLECTION,
  );

  if (exists) {
    return;
  }

  await qdrant.createCollection(QDRANT_COLLECTION, {
    vectors: {
      size: 1024,
      distance: "Cosine",
    },
  });
}

export async function upsertChunkVectors(vectors: ChunkVector[]) {
  await initVectorCollection();

  await qdrant.upsert(QDRANT_COLLECTION, {
    wait: true,

    points: vectors.map((item) => ({
      id: crypto.randomUUID(),

      vector: item.vector,

      payload: {
        chunkId: item.id,
        documentId: item.documentId,
        content: item.content,
        index: item.index,
      },
    })),
  });
}

export async function searchSimilarChunks(vector: number[], limit = 5) {
  await initVectorCollection();

  return qdrant.search(QDRANT_COLLECTION, {
    vector,
    limit,
    with_payload: true,
  });
}
