/**
 * Split long text into overlapping chunks so Gemini can read small,
 * relevant pieces instead of an entire document at once.
 */
export function chunkText(text, chunkSize = 800, overlap = 150) {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  if (!cleaned) return [];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // Prefer splitting on a paragraph or sentence boundary.
    if (end < cleaned.length) {
      const window = cleaned.slice(start, end);
      const breakAt = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("\n")
      );
      if (breakAt > chunkSize * 0.4) {
        end = start + breakAt + 1;
      }
    }

    const piece = cleaned.slice(start, end).trim();
    if (piece) chunks.push(piece);

    if (end >= cleaned.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}
