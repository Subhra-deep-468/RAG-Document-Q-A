# Gemini + ChromaDB RAG App

A complete beginner-friendly **Retrieval-Augmented Generation** app:

- **React** chat UI for uploading files and asking questions
- **Node.js / Express** API for chunking, embeddings, retrieval, and generation
- **ChromaDB** as the vector database
- **Google Gemini** for embeddings and answers

## How RAG works here

```
Document  →  chunks  →  Gemini embeddings  →  ChromaDB
                                                      ↓
Question  →  Gemini embedding  →  nearest chunks  →  Gemini answer
```

## What you need

1. Node.js 18+
2. A free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
3. Optional: Docker Desktop if you want the real ChromaDB server (the app also has a local cosine vector store so beginners can start without Docker)

## Setup

```bash
cd "rag project"
npm install
npm run install:all
copy backend\.env.example backend\.env
```

Open `backend/.env` and paste your key:

```
GEMINI_API_KEY=your_real_key
```

Start ChromaDB:

```bash
docker compose up -d
```

Start the API and the React app:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Try it

1. Upload `sample-docs/what-is-rag.txt` and `sample-docs/gemini-and-chromadb.txt`
2. Ask: **What is RAG in simple words?**
3. Expand the source chips under the answer. Those are the ChromaDB chunks Gemini actually saw.

## Project map

| Path | Role |
| --- | --- |
| `backend/src/chunker.js` | Split text into overlapping pieces |
| `backend/src/gemini.js` | Embeddings + answer generation |
| `backend/src/chroma.js` | Vector database client |
| `backend/src/ingest.js` | Upload → extract → embed → store |
| `backend/src/rag.js` | Question → retrieve → generate |
| `frontend/src` | Chat UI, upload panel, source viewer |

## Common issues

- **ChromaDB is not running** — start Docker Desktop, then `docker compose up -d`
- **Missing GEMINI_API_KEY** — copy `.env.example` and add a key
- **Model not found** — set `GEMINI_CHAT_MODEL` in `.env` to a model your account can use, such as `gemini-2.0-flash` or `gemini-1.5-flash`
