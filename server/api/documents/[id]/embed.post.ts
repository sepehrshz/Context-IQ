import { getChunksByDocumentId } from "~~/server/repositories/chunk.repository";
import { getDocumentById } from "~~/server/repositories/document.repository";
import { generateEmbeddings } from "~~/server/services/embedding.service";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Document ID is required.",
    });
  }

  const document = await getDocumentById(id);

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found.",
    });
  }

  const chunks = await getChunksByDocumentId(document.id);

  if (!chunks.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Document has no chunks.",
    });
  }

  const texts = chunks.map((chunk) => chunk.content);

  const embeddings = await generateEmbeddings(texts);

  return {
    ok: true,
    documentId: document.id,
    chunks: chunks.map((chunk, index) => ({
      chunkId: chunk.id,
      index: chunk.index,
      embedding: embeddings[index],
    })),
  };
});
