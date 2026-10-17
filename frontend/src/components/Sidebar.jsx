import { useRef } from "react";

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function Sidebar({
  documents,
  health,
  statusLabel,
  busy,
  error,
  onUpload,
  onDelete,
  onRefresh,
}) {
  const inputRef = useRef(null);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">RAG</div>
        <div>
          <h1>Gemini Studio</h1>
          <p>Retrieve → Augment → Generate</p>
        </div>
      </div>

      <div className={`status-card ${health?.ok ? "ok" : "warn"}`}>
        <div className="status-row">
          <span>{statusLabel}</span>
          <button className="ghost" onClick={onRefresh} type="button">
            Recheck
          </button>
        </div>
        <ul>
          <li>
            <i className={health?.gemini ? "dot on" : "dot"} /> Gemini API
          </li>
          <li>
            <i className={health?.chroma ? "dot on" : "dot"} />{" "}
            {health?.chromaMode === "local" ? "Local vector store" : "ChromaDB"}
          </li>
        </ul>
        {health?.chromaError && <small>{health.chromaError}</small>}
        {health?.geminiError && <small>{health.geminiError}</small>}
      </div>

      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) onUpload(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <strong>Upload a knowledge file</strong>
        <span>PDF, TXT, or Markdown. We chunk it, embed it, and store it in ChromaDB.</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {busy && <div className="banner">{busy}</div>}
      {error && <div className="banner error">{error}</div>}

      <div className="doc-head">
        <h2>Knowledge base</h2>
        <span>{documents.length}</span>
      </div>
      <div className="doc-list">
        {documents.length === 0 && (
          <p className="empty">No documents yet. Try the sample files in /sample-docs.</p>
        )}
        {documents.map((doc) => (
          <article key={doc.id} className="doc-card">
            <div>
              <strong>{doc.filename}</strong>
              <p>
                {doc.chunkCount} chunks · {bytes(doc.size)}
              </p>
            </div>
            <button className="ghost danger" type="button" onClick={() => onDelete(doc.id)}>
              Remove
            </button>
          </article>
        ))}
      </div>
    </aside>
  );
}
