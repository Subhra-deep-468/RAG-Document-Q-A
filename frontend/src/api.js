async function request(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),
  documents: () => request("/api/documents"),
  upload: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/api/documents", { method: "POST", body });
  },
  remove: (id) => request(`/api/documents/${id}`, { method: "DELETE" }),
  ask: (question) =>
    request("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }),
};
