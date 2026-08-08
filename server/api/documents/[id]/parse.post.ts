import { parseDocument } from "../../../services/parsing.service";
import prisma from "../../../libs/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Document ID is required",
    });
  }

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw createError({
      statusCode: 404,
      statusMessage: "Document not found",
    });
  }

  const text = await parseDocument(document.path, document.mimeType);

  const updatedDocument = await prisma.document.update({
    where: {
      id: document.id,
    },
    data: {
      text,
      status: "PARSED",
    },
  });

  return updatedDocument;
});
