import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config.js";

function client() {
  if (!config.geminiApiKey || config.geminiApiKey.includes("your_gemini")) {
    const err = new Error(
      "Missing GEMINI_API_KEY. Copy backend/.env.example to backend/.env and paste a key from https://aistudio.google.com/apikey"
    );
    err.status = 400;
    throw err;
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
}

export async function embedTexts(texts) {
  const model = client().getGenerativeModel({ model: config.geminiEmbedModel });
  const embeddings = [];

  // Gemini embedding calls are per-text; batch in small groups.
  for (const text of texts) {
    const result = await model.embedContent(text.slice(0, 8000));
    embeddings.push(result.embedding.values);
  }

  return embeddings;
}

export async function generateAnswer(question, contexts) {
  const model = client().getGenerativeModel({ model: config.geminiChatModel });
  const contextBlock = contexts
    .map(
      (c, i) =>
        `[Source ${i + 1} | ${c.filename} | chunk ${c.chunkIndex + 1}]\n${c.text}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are a helpful RAG assistant. Answer the user's question using ONLY the retrieved sources below.
If the sources do not contain the answer, say you do not have that information in the uploaded documents.
Cite sources like [Source 1] when you use them. Be clear and beginner-friendly.

Retrieved sources:
${contextBlock || "(no sources retrieved)"}

User question:
${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function pingGemini() {
  await embedTexts(["ping"]);
  return true;
}
