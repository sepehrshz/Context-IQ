import { deleteDocument } from "~~/server/repositories/document.repository.ts";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;

  return await deleteDocument(id);
});
