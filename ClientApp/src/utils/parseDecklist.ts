export type DecklistEntry = {
  quantity: number;
  name: string;
};

/**
 * Client-side decklist parser — intentionally duplicates the backend
 * DecklistParser regex so the frontend can parse locally, check the
 * card cache, and only send uncached names to the API.
 */
export function parseDecklist(text: string): DecklistEntry[] {
  const entries: DecklistEntry[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^\s*(\d+)\s*[xX]?\s+(.+?)\s*$/);
    if (match) {
      entries.push({ quantity: parseInt(match[1], 10), name: match[2] });
    }
  }
  return entries;
}
