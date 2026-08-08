import { deleteDocument } from "../../repositories/document.repository";
import prisma from "../../libs/prisma";
import { resolve } from "node:path";
import { unlink } from "node:fs/promises";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found",
    });
  }

  const filePath = resolve(process.cwd(), document.path);

  try {
    await unlink(filePath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to delete file from disk",
      });
    }
  }

  return await deleteDocument(id);
});
