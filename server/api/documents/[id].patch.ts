import { renameDocument } from "~~/server/repositories/document.repository.ts";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;

  const body = await readBody(event);

  return await renameDocument(id, body.fileName);
});
