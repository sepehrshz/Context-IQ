interface EmbeddingResponse {
  embeddings: number[][];
}

export async function generateEmbeddings(texts: string[]) {
  const response = await fetch("http://127.0.0.1:8000/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ texts }),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding API failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as EmbeddingResponse;

  return data.embeddings;
}
