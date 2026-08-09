import { getRouterParam, createError, defineEventHandler } from "h3";
import { processDocument } from "../../server/services/document-processing.service";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Document ID is required.",
    });
  }

  try {
    const result = await processDocument(id);

    return result;
  } catch (error) {
    console.error("Document ingestion failed:", error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : "Document ingestion failed.",
    });
  }
});
