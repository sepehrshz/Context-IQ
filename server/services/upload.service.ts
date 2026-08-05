import { mkdir, writeFile } from "node:fs/promises";
import type { MultiPartData } from "h3";
import path, { join, resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import type { UploadedFile } from "../types/upload";

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

  const uploadTasks = parts.map(async (part) => {
    if (!part.filename || !part.data) {
      return null;
    }

    const hash = createHash("sha256").update(part.data).digest("hex");

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

    return {
      originalName,
      savedName,
      path: `uploads/${savedName}`,
      size: part.data.length,
      mimeType: part.type || "application/octet-stream",
      hash,
    } satisfies UploadedFile;
  });

  const files = await Promise.all(uploadTasks);

  const savedFiles = files.filter(
    (file): file is UploadedFile => file !== null,
  );

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
