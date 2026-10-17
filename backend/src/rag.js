import { embedTexts, generateAnswer } from "./gemini.js";
import { getCollection } from "./chroma.js";
import { config } from "./config.js";

export async function askQuestion(question, topK = config.topK) {
  const q = String(question || "").trim();
  if (!q) {
    const err = new Error("Please type a question.");
    err.status = 400;
    throw err;
  }

  const [queryEmbedding] = await embedTexts([q]);
  const collection = await getCollection();
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  const sources = documents.map((text, i) => {
    const meta = metadatas[i] || {};
    const distance = distances[i];
    // Chroma cosine distance: 0 is identical, 2 is opposite. Convert to a 0-100 score.
    const score =
      typeof distance === "number"
        ? Math.max(0, Math.min(100, Math.round((1 - distance / 2) * 100)))
        : null;

    return {
      text,
      filename: meta.filename || "unknown",
      chunkIndex: Number(meta.chunkIndex || 0),
      documentId: meta.documentId,
      score,
    };
  });

  const answer = await generateAnswer(q, sources);
  return { answer, sources, question: q };
}
