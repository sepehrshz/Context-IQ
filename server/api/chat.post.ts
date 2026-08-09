import { buildContext } from "~~/server/services/context.service";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    query?: string;
    limit?: number;
  }>(event);

  if (!body?.query?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Query is required.",
    });
  }

  const limit = Math.min(Math.max(body.limit ?? 5, 1), 10);

  const context = await buildContext(body.query, limit);

  return {
    query: body.query,
    context,
  };
});
