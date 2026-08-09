import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function parseDocument(
  filePath: string,
  mimeType: string,
): Promise<string> {
  const absolutePath = path.resolve(process.cwd(), filePath);

  switch (mimeType) {
    case "application/pdf":
      return parsePdf(absolutePath);

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return parseDocx(absolutePath);

    case "text/plain":
    case "text/markdown":
      return parseText(absolutePath);

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);

  const parser = new PDFParse({
    data: buffer,
  });

  const data = await parser.getText();

  return data.text.trim();
}

async function parseDocx(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);

  const result = await mammoth.extractRawText({
    buffer,
  });

  return result.value.trim();
}

async function parseText(filePath: string): Promise<string> {
  const text = await readFile(filePath, "utf8");

  return text.trim();
}
