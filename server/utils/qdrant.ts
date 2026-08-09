import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: "http://localhost:6333",
});

export const QDRANT_COLLECTION = "document_chunks";
