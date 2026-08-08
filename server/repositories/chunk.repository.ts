import prisma from "../libs/prisma";
import type { DocumentChunk } from "../services/chunking.service.ts";

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
