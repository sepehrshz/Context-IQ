import { searchDocuments } from "~~/server/services/retrieval.service";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    query?: string;
    limit?: number;
  }>(event);

  if (!body.query?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Query is required.",
    });
  }

  const limit = Math.min(Math.max(body.limit ?? 5, 1), 20);

  const results = await searchDocuments(body.query, limit);

  return {
    query: body.query,
    results,
  };
});
