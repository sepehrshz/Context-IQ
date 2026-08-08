import { uploadFiles } from "~~/server/services/upload.service";
import { createDocument } from "~~/server/repositories/document.repository";
import { parseDocument } from "~~/server/services/parsing.service";

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);

  if (!parts) {
    throw createError({
      statusCode: 400,
      message: "No files received",
    });
  }

  const files = await uploadFiles(parts);

  const documents = await Promise.all(
    files.data.map((file) =>
      createDocument({
        originalName: file.originalName,
        savedName: file.savedName,
        path: file.path,
        mimeType: file.mimeType,
        size: file.size,
        hash: file.hash,
      }),
    ),
  );

  return documents;
});
