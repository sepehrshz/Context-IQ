import { qdrant, QDRANT_COLLECTION } from "~~/server/utils/qdrant";
import { createHash } from "node:crypto";

export interface ChunkVector {
  id: string;
  vector: number[];
  content: string;
  documentId: string;
  index: number;
}

function getQdrantPointId(chunkId: string): string {
  const hash = createHash("md5").update(chunkId).digest("hex");

  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "5" + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80)
      .toString(16)
      .padStart(2, "0") + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join("-");
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
  if (!vectors.length) {
    return;
  }

  for (const vector of vectors) {
    if (!Array.isArray(vector.vector) || vector.vector.length !== 1024) {
      throw new Error(
        `Invalid embedding for chunk ${vector.id}. Expected 1024 dimensions.`,
      );
    }
  }

  await initVectorCollection();

  await qdrant.upsert(QDRANT_COLLECTION, {
    wait: true,

    points: vectors.map((item) => ({
      id: getQdrantPointId(item.id),

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

export async function deleteDocumentVectors(documentId: string) {
  await initVectorCollection();

  return qdrant.delete(QDRANT_COLLECTION, {
    wait: true,
    filter: {
      must: [
        {
          key: "documentId",
          match: {
            value: documentId,
          },
        },
      ],
    },
  });
}
