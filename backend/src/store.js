import fs from "node:fs/promises";
import { config } from "./config.js";

export async function ensureDirs() {
  await fs.mkdir(config.uploadsDir, { recursive: true });
  await fs.mkdir(config.dataDir, { recursive: true });
  try {
    await fs.access(config.docsFile);
  } catch {
    await fs.writeFile(config.docsFile, "[]", "utf8");
  }
}

export async function listDocuments() {
  const raw = await fs.readFile(config.docsFile, "utf8");
  return JSON.parse(raw);
}

export async function saveDocuments(docs) {
  await fs.writeFile(config.docsFile, JSON.stringify(docs, null, 2), "utf8");
}

export async function addDocument(doc) {
  const docs = await listDocuments();
  docs.unshift(doc);
  await saveDocuments(docs);
  return doc;
}

export async function removeDocument(id) {
  const docs = await listDocuments();
  const next = docs.filter((d) => d.id !== id);
  await saveDocuments(next);
  const removed = docs.find((d) => d.id === id);
  return removed;
}
