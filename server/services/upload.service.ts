import { mkdir, writeFile } from "node:fs/promises";
import type { MultiPartData } from "h3";
import path, { join, resolve } from "node:path";
import { UploadedFile } from "../types/upload";
import { randomUUID } from "node:crypto";

export async function uploadFiles(parts: MultiPartData[]) {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ];
  const allowedExtensions = [".pdf", ".docx", ".txt", ".md"];

  if (!parts.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files received.",
    });
  }

  const uploadsDirectory = resolve(process.cwd(), "uploads");
  await mkdir(uploadsDirectory, { recursive: true });

  const savedFiles: UploadedFile[] = [];

  for (const part of parts) {
    if (!part.filename || !part.data) {
      continue;
    }

    const originalName = part.filename;
    const ext = path.extname(originalName).toLowerCase();

    if (
      !allowedMimeTypes.includes(part.type || "") ||
      !allowedExtensions.includes(ext)
    ) {
      throw createError({
        statusCode: 400,
        message: "File type not allowed",
      });
    }

    const safeName = path
      .basename(originalName)
      .replace(/[^a-zA-Z0-9._-]+/g, "_");
    const savedName = `${randomUUID()}-${safeName}`;
    const absolutePath = join(uploadsDirectory, savedName);

    await writeFile(absolutePath, part.data);

    savedFiles.push({
      originalName,
      savedName,
      relativePath: `uploads/${savedName}`,
      size: part.data.length,
      mimeType: part.type || "application/octet-stream",
    });
  }

  if (!savedFiles.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid files received.",
    });
  }

  return {
    success: true,
    data: savedFiles,
  };
}
