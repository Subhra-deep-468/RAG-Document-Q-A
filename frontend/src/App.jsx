import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import Chat from "./components/Chat.jsx";

export default function App() {
  const [health, setHealth] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const ready = Boolean(health?.chroma && health?.gemini);

  async function refresh() {
    const [h, d] = await Promise.all([api.health(), api.documents()]);
    setHealth(h);
    setDocuments(d.documents);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  async function onUpload(file) {
    setError("");
    setBusy(`Indexing ${file.name}…`);
    try {
      await api.upload(file);
      const d = await api.documents();
      setDocuments(d.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function onDelete(id) {
    setError("");
    try {
      await api.remove(id);
      setDocuments((docs) => docs.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function onAsk(question) {
    setError("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setBusy("Retrieving sources and asking Gemini…");
    try {
      const result = await api.ask(question);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `I could not complete that RAG request: ${err.message}`,
          sources: [],
        },
      ]);
    } finally {
      setBusy("");
    }
  }

  const statusLabel = useMemo(() => {
    if (!health) return "Checking services…";
    if (health.gemini && health.chromaMode === "server") return "Gemini + ChromaDB connected";
    if (health.gemini && health.chroma) return "Gemini connected · local vector store";
    return "Setup needed";
  }, [health]);

  return (
    <div className="app-shell">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <Sidebar
        documents={documents}
        health={health}
        statusLabel={statusLabel}
        busy={busy}
        error={error}
        onUpload={onUpload}
        onDelete={onDelete}
        onRefresh={() => refresh().catch((err) => setError(err.message))}
      />
      <Chat
        messages={messages}
        busy={busy}
        ready={ready}
        hasDocs={documents.length > 0}
        onAsk={onAsk}
      />
    </div>
  );
}
