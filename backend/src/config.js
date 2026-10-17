import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

export const config = {
  port: Number(process.env.PORT || 5050),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash",
  geminiEmbedModel: process.env.GEMINI_EMBED_MODEL || "text-embedding-004",
  chromaUrl: process.env.CHROMA_URL || "http://localhost:8000",
  chromaCollection: process.env.CHROMA_COLLECTION || "rag_documents",
  uploadsDir: path.join(backendRoot, "uploads"),
  dataDir: path.join(backendRoot, "data"),
  docsFile: path.join(backendRoot, "data", "documents.json"),
  // Chunk size in characters. ~800 chars is a solid beginner default.
  chunkSize: 800,
  chunkOverlap: 150,
  topK: 5,
};
