import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

function cosineDistance(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const sim = dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
  return 1 - sim;
}

export function createLocalCollection(filePath) {
  let records = [];

  async function load() {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      records = JSON.parse(raw);
    } catch {
      records = [];
      await persist();
    }
  }

  async function persist() {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(records), "utf8");
  }

  return {
    async add({ ids, embeddings, documents, metadatas }) {
      await load();
      ids.forEach((id, i) => {
        records.push({
          id,
          embedding: embeddings[i],
          document: documents[i],
          metadata: metadatas[i] || {},
        });
      });
      await persist();
    },

    async query({ queryEmbeddings, nResults }) {
      await load();
      const query = queryEmbeddings[0];
      const ranked = records
        .map((row) => ({
          ...row,
          distance: cosineDistance(query, row.embedding),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, nResults);

      return {
        documents: [ranked.map((r) => r.document)],
        metadatas: [ranked.map((r) => r.metadata)],
        distances: [ranked.map((r) => r.distance)],
      };
    },

    async delete({ where }) {
      await load();
      records = records.filter((row) => {
        return !Object.entries(where || {}).every(([key, value]) => row.metadata?.[key] === value);
      });
      await persist();
    },
  };
}

export const localCollectionPath = path.join(config.dataDir, "chroma-local.json");
