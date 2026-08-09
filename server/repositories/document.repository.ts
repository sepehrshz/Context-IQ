import prisma from "../libs/prisma";
import type { UploadedFile } from "../types/upload";
import type { DocumentStatus } from "../generated/prisma/client";

export async function getAllDocuments() {
  return prisma.document.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDocumentById(id: string) {
  return prisma.document.findUnique({
    where: {
      id,
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
  }

  return prisma.document.create({
    data,
  });
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
) {
  return prisma.document.update({
    where: {
      id: documentId,
    },
    data: {
      status,
    },
  });
}

export async function updateDocumentText(documentId: string, text: string) {
  return prisma.document.update({
    where: {
      id: documentId,
    },
    data: {
      text,
    },
  });
}

export async function deleteDocument(id: string) {
  return prisma.document.delete({
    where: {
      id,
    },
  });
}
