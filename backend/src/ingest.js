import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import { chunkText } from "./chunker.js";
import { embedTexts } from "./gemini.js";
import { getCollection } from "./chroma.js";
import { addDocument, removeDocument } from "./store.js";
import { config } from "./config.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = await fs.readFile(filePath);

  if (ext === ".pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }

  if ([".txt", ".md", ".markdown", ".csv"].includes(ext)) {
    return buffer.toString("utf8");
  }

  const err = new Error("Supported file types: PDF, TXT, MD");
  err.status = 400;
  throw err;
}

export async function ingestFile({ storedName, originalName, size }) {
  const filePath = path.join(config.uploadsDir, storedName);
  const text = await extractText(filePath, originalName);
  const chunks = chunkText(text, config.chunkSize, config.chunkOverlap);

  if (chunks.length === 0) {
    const err = new Error("No readable text was found in that file.");
    err.status = 400;
    throw err;
  }

  const id = crypto.randomUUID();
  const embeddings = await embedTexts(chunks);
  const collection = await getCollection();
  const ids = chunks.map((_, i) => `${id}_${i}`);

  await collection.add({
    ids,
    embeddings,
    documents: chunks,
    metadatas: chunks.map((_, i) => ({
      documentId: id,
      filename: originalName,
      chunkIndex: String(i),
      totalChunks: String(chunks.length),
    })),
  });

  const doc = {
    id,
    filename: originalName,
    storedName,
    size,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
  };

  await addDocument(doc);
  return doc;
}

export async function deleteIngestedDocument(id) {
  const removed = await removeDocument(id);
  if (!removed) {
    const err = new Error("Document not found");
    err.status = 404;
    throw err;
  }

  const collection = await getCollection();
  await collection.delete({ where: { documentId: id } });

  if (removed.storedName) {
    await fs.unlink(path.join(config.uploadsDir, removed.storedName)).catch(() => {});
  }

  return removed;
}
