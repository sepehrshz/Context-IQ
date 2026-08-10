import {
  getDocumentById,
  updateDocumentStatus,
  updateDocumentText,
} from "../repositories/document.repository";

import {
  createChunks,
  getChunksByDocumentId,
} from "../repositories/chunk.repository";

import { createDocumentChunks } from "./chunking.service";
import { parseDocument } from "./parsing.service";
import { generateEmbeddings } from "./embedding.service";
import { upsertChunkVectors } from "./vector.service";

import { DocumentStatus } from "../generated/prisma/client";

export async function processDocument(documentId: string) {
  try {
    const document = await getDocumentById(documentId);

    if (!document) {
      throw new Error(`Document ${documentId} not found.`);
    }

    // =========================
    // PARSING
    // =========================

    await updateDocumentStatus(documentId, DocumentStatus.PARSING);

    const text = await parseDocument(document.path, document.mimeType);
    if (!text) {
      throw new Error("Document contains no readable text.");
    }

    await updateDocumentText(documentId, text);

    await updateDocumentStatus(documentId, DocumentStatus.PARSED);

    // =========================
    // CHUNKING
    // =========================

    await updateDocumentStatus(documentId, DocumentStatus.CHUNKING);

    const chunks = createDocumentChunks(text);
    if (!chunks.length) {
      throw new Error("No chunks could be created.");
    }

    await createChunks(documentId, chunks);

    await updateDocumentStatus(documentId, DocumentStatus.CHUNKED);

    // =========================
    // GET CHUNKS WITH DB IDS
    // =========================

    const storedChunks = await getChunksByDocumentId(documentId);
    if (!storedChunks.length) {
      throw new Error("Chunks were created but could not be retrieved.");
    }

    // =========================
    // EMBEDDING
    // =========================

    await updateDocumentStatus(documentId, DocumentStatus.EMBEDDING);

    const embeddings = await generateEmbeddings(
      storedChunks.map((chunk) => chunk.content),
    );
    if (embeddings.length !== storedChunks.length) {
      throw new Error(
        `Embedding count mismatch. Chunks: ${storedChunks.length}, embeddings: ${embeddings.length}`,
      );
    }

    // =========================
    // QDRANT
    // =========================

    const vectors = storedChunks.map((chunk, index) => {
      const vector = embeddings[index];

      if (!vector) {
        throw new Error(`Missing embedding for chunk ${chunk.id}`);
      }

      return {
        id: chunk.id,
        vector,
        content: chunk.content,
        documentId: chunk.documentId,
        index: chunk.index,
      };
    });

    await upsertChunkVectors(vectors);

    // =========================
    // COMPLETED
    // =========================

    await updateDocumentStatus(documentId, DocumentStatus.COMPLETED);

    return {
      ok: true,
      documentId,
      chunks: storedChunks.length,
    };
  } catch (error) {
    console.error(`Document processing failed: ${documentId}`, error);

    try {
      await updateDocumentStatus(documentId, DocumentStatus.FAILED);
    } catch (statusError) {
      console.error("Failed to update document status to FAILED:", statusError);
    }

    throw error;
  }
}
