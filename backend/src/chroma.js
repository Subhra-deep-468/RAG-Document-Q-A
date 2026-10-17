import { ChromaClient } from "chromadb";
import { config } from "./config.js";
import { createLocalCollection, localCollectionPath } from "./localCollection.js";

let cachedCollection = null;
let mode = "unknown";

const suppliedEmbeddings = {
  generate: async (texts) => texts.map(() => []),
};

export function getChromaMode() {
  return mode;
}

export function chromaClient() {
  return new ChromaClient({ path: config.chromaUrl });
}

export async function getCollection() {
  if (cachedCollection) return cachedCollection;

  try {
    const client = chromaClient();
    await client.heartbeat();
    cachedCollection = await client.getOrCreateCollection({
      name: config.chromaCollection,
      embeddingFunction: suppliedEmbeddings,
      metadata: {
        "hnsw:space": "cosine",
        description: "RAG chunks for the beginner Gemini + Chroma app",
      },
    });
    mode = "server";
    return cachedCollection;
  } catch (error) {
    console.warn("ChromaDB server not reachable. Using the local cosine store instead.");
    console.warn(friendlyChromaError(error));
    cachedCollection = createLocalCollection(localCollectionPath);
    mode = "local";
    return cachedCollection;
  }
}

export async function resetCollectionCache() {
  cachedCollection = null;
  mode = "unknown";
}

export async function pingChroma() {
  try {
    await chromaClient().heartbeat();
    mode = "server";
    return { ok: true, mode };
  } catch {
    await getCollection();
    return { ok: true, mode: "local" };
  }
}

export function friendlyChromaError(error) {
  const message = String(error?.message || error);
  if (
    message.includes("fetch") ||
    message.includes("ECONNREFUSED") ||
    message.includes("Failed to fetch") ||
    message.includes("network")
  ) {
    return "ChromaDB server is not running. The app will store vectors locally until you start it with: docker compose up -d";
  }
  return message;
}
