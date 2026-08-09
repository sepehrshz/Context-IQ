import { buildContext } from "~~/server/services/context.service";
import { generateAnswer } from "~~/server/services/llm.service";

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

  const contextChunks = await buildContext(body.query, limit);

  const context = contextChunks
    .map((chunk, index) => {
      return `[Source ${index + 1}]\n${chunk.content}`;
    })
    .join("\n\n");

  const answer = await generateAnswer(body.query, context);

  return {
    query: body.query,
    answer,
    sources: contextChunks,
  };
});
