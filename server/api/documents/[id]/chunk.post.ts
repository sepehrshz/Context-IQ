import { createDocumentChunks } from "../../../services/chunking.service.ts";
import { getDocumentById } from "../../../repositories/document.repository.ts";
import { createChunks } from "../../../repositories/chunk.repository.ts";

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

  if (!document.text?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Document has no content to chunk.",
    });
  }

  const chunks = createDocumentChunks(document.text);

  if (!chunks.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "No chunks could be created.",
    });
  }

  await createChunks(document.id, chunks);

  return {
    ok: true,
    documentId: document.id,
    chunksCreated: chunks.length,
  };
});
