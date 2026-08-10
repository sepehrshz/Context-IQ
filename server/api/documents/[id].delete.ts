import { deleteDocument } from "../../repositories/document.repository";
import { getDocumentById } from "../../repositories/document.repository";
import { deleteDocumentVectors } from "../../services/vector.service";
import { resolve } from "node:path";
import { unlink } from "node:fs/promises";

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

  // Delete vectors from Qdrant
  await deleteDocumentVectors(document.id);

  // Delete physical file
  const filePath = resolve(process.cwd(), document.path);

  try {
    await unlink(filePath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to delete file from disk.",
      });
    }
  }

  // Delete document and its chunks
  await deleteDocument(document.id);

  return {
    success: true,
    documentId: document.id,
    message: "Document deleted successfully.",
  };
});
