import { OpenRouter } from "@openrouter/sdk";

export async function generateAnswer(query: string, context: string) {
  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const response = await openrouter.chat.send({
    chatRequest: {
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      // model: "openrouter/free",

      stream: false,
      messages: [
        {
          role: "system",
          content: `
You are a helpful RAG assistant.

Answer the user's question using only the provided context.

Rules:
- Do not use outside knowledge.
- Do not invent facts.
- If the answer cannot be found in the context, say that you don't have enough information.
- Give a clear and concise answer.

Context:
${context}
`,
        },
        {
          role: "user",
          content: query,
        },
      ],
    },
  });

  return response.choices[0]?.message?.content ?? "";
}
