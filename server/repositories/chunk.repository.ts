import prisma from "../libs/prisma";
import type { DocumentChunk } from "../services/chunking.service";

export async function createChunks(
  documentId: string,
  chunks: DocumentChunk[],
) {
  return prisma.chunk.createMany({
    data: chunks.map((chunk) => ({
      documentId,
      content: chunk.content,
      index: chunk.index,
    })),
  });
}

export async function getChunksByDocumentId(documentId: string) {
  return prisma.chunk.findMany({
    where: {
      documentId,
    },
    orderBy: {
      index: "asc",
    },
  });
}
