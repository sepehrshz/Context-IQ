import { getAllDocuments } from "~~/server/repositories/document.repository";
export default defineEventHandler(async () => {
  return await getAllDocuments();
});
