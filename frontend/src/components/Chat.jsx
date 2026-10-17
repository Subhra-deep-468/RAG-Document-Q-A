import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "What is RAG in simple words?",
  "How do Gemini embeddings and ChromaDB work together?",
  "Walk me through the steps this app takes to answer a question.",
];

export default function Chat({ messages, busy, ready, hasDocs, onAsk }) {
  const [question, setQuestion] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function submit(text) {
    const q = (text || question).trim();
    if (!q || busy) return;
    setQuestion("");
    onAsk(q);
  }

  return (
    <main className="chat">
      <header className="chat-header">
        <div>
          <h2>Ask your documents</h2>
          <p>Answers are grounded in retrieved ChromaDB chunks, not the open internet.</p>
        </div>
        <div className="pills">
          <span>Gemini</span>
          <span>ChromaDB</span>
          <span>Node + React</span>
        </div>
      </header>

      <section className="transcript">
        {messages.length === 0 && (
          <div className="welcome">
            <h3>A tiny RAG pipeline, fully wired</h3>
            <ol>
              <li>Upload a document. The server splits it into overlapping chunks.</li>
              <li>Gemini turns each chunk into an embedding vector.</li>
              <li>ChromaDB stores those vectors so similar meaning can be found later.</li>
              <li>Your question is embedded too, nearby chunks are retrieved, and Gemini writes the answer.</li>
            </ol>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => submit(s)} disabled={!ready}>
                  {s}
                </button>
              ))}
            </div>
            {!hasDocs && (
              <p className="hint">Upload a file first so retrieval has something to search.</p>
            )}
            {!ready && (
              <p className="hint">
                Start ChromaDB with Docker and add your Gemini key in backend/.env, then click Recheck.
              </p>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <article key={i} className={`bubble ${m.role}`}>
            <div className="meta">{m.role === "user" ? "You" : "Gemini + retrieved context"}</div>
            <div className="body">{m.content}</div>
            {m.sources?.length > 0 && (
              <div className="sources">
                {m.sources.map((s, idx) => (
                  <details key={idx}>
                    <summary>
                      Source {idx + 1}: {s.filename}
                      {s.score != null ? ` · ${s.score}% match` : ""}
                    </summary>
                    <pre>{s.text}</pre>
                  </details>
                ))}
              </div>
            )}
          </article>
        ))}
        {busy && <div className="typing">Working through retrieve → augment → generate</div>}
        <div ref={endRef} />
      </section>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something that is inside your uploaded files…"
          disabled={Boolean(busy)}
        />
        <button type="submit" disabled={Boolean(busy) || !question.trim()}>
          Ask
        </button>
      </form>
    </main>
  );
}
