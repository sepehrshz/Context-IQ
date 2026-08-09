import { getChunksByDocumentId } from "~~/server/repositories/chunk.repository";
import { getDocumentById } from "~~/server/repositories/document.repository";
import { generateEmbeddings } from "~~/server/services/embedding.service";
import { upsertChunkVectors } from "~~/server/services/vector.service";

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

  if (embeddings.length !== chunks.length) {
    throw createError({
      statusCode: 500,
      statusMessage: "Embedding count does not match chunk count.",
    });
  }

  const vectors = [];

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const embedding = embeddings[index];

    if (!chunk || !embedding) {
      throw createError({
        statusCode: 500,
        statusMessage: `Missing chunk or embedding at index ${index}.`,
      });
    }

    vectors.push({
      id: chunk.id,
      vector: embedding,
      content: chunk.content,
      documentId: document.id,
      index: chunk.index,
    });
  }

  await upsertChunkVectors(vectors);

  return {
    ok: true,
    documentId: document.id,
    chunksEmbedded: embeddings.length,
  };
});
