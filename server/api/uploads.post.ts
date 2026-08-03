import { uploadFiles } from "../services/upload.service";

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);

  if (!parts) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files received.",
    });
  }

  const files = await uploadFiles(parts);

  return {
    files,
  };
});
