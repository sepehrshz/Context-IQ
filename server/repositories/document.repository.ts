import prisma from "../libs/prisma";
import type { UploadedFile } from "../types/upload";

export async function getAllDocuments() {
  return prisma.document.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createDocument(data: UploadedFile) {
  const existingDocument = await prisma.document.findUnique({
    where: {
      hash: data.hash,
    },
  });
  if (existingDocument) {
    throw createError({
      statusCode: 409,
      statusMessage: "Duplicate file",
    });
  } else {
    return prisma.document.create({
      data,
    });
  }
}

export async function deleteDocument(id: string) {
  return prisma.document.delete({
    where: {
      id,
    },
  });
}
