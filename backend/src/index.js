import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";
import { ensureDirs, listDocuments } from "./store.js";
import { ingestFile, deleteIngestedDocument } from "./ingest.js";
import { askQuestion } from "./rag.js";
import { pingGemini } from "./gemini.js";
import { pingChroma, friendlyChromaError } from "./chroma.js";

await ensureDirs();

const app = express();
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadsDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
      cb(null, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".txt", ".md", ".markdown"].includes(ext)) cb(null, true);
    else cb(new Error("Supported file types: PDF, TXT, MD"));
  },
});

app.get("/api/health", async (_req, res) => {
  const status = {
    ok: true,
    geminiKeyPresent: Boolean(config.geminiApiKey) && !config.geminiApiKey.includes("your_gemini"),
    chroma: false,
    chromaMode: "unknown",
    gemini: false,
    chatModel: config.geminiChatModel,
    embedModel: config.geminiEmbedModel,
  };

  try {
    const chroma = await pingChroma();
    status.chroma = chroma.ok;
    status.chromaMode = chroma.mode;
    if (chroma.mode === "local") {
      status.chromaError =
        "ChromaDB Docker server is offline. Using a local cosine vector store so you can still learn RAG.";
    }
  } catch (error) {
    status.chromaError = friendlyChromaError(error);
    status.ok = false;
  }

  if (status.geminiKeyPresent) {
    try {
      await pingGemini();
      status.gemini = true;
    } catch (error) {
      status.geminiError = error.message;
      status.ok = false;
    }
  } else {
    status.ok = false;
    status.geminiError = "GEMINI_API_KEY is missing";
  }

  res.json(status);
});

app.get("/api/documents", async (_req, res, next) => {
  try {
    res.json({ documents: await listDocuments() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/documents", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Choose a PDF, TXT, or MD file to upload." });
    }
    const doc = await ingestFile({
      storedName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
    res.status(201).json({ document: doc });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/documents/:id", async (req, res, next) => {
  try {
    await deleteIngestedDocument(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/ask", async (req, res, next) => {
  try {
    const result = await askQuestion(req.body?.question, req.body?.topK);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const chromaHint = friendlyChromaError(error);
  const message = chromaHint !== error.message ? chromaHint : error.message;
  const status = error.status || (message.includes("ChromaDB is not running") ? 503 : 500);
  console.error(error);
  res.status(status).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`RAG API ready at http://localhost:${config.port}`);
  console.log("1) Start ChromaDB: docker compose up -d");
  console.log("2) Set GEMINI_API_KEY in backend/.env");
  console.log("3) Open the React app at http://localhost:5173");
});
