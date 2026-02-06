import { useRef, useState } from 'react';
import { DecklistInput, CardGrid, PrintView } from '~/components';
import type { CardInfo } from '~/types/card';
import { getCachedCard, cacheCards } from '~/cardCache';
import '~/App.css';

type DecklistEntry = {
  quantity: number;
  name: string;
};

function parseDecklist(text: string): DecklistEntry[] {
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

export default function App() {
  const [cards, setCards] = useState<CardInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (decklist: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const entries = parseDecklist(decklist);
      if (entries.length === 0) {
        setError('No valid card entries found in decklist.');
        return;
      }

      // Deduplicate and check cache
      const uniqueNames = [...new Set(entries.map((e) => e.name.toLowerCase()))];
      const cached = new Map<string, Omit<CardInfo, 'quantity'>>();
      const uncachedNames: string[] = [];

      for (const name of uniqueNames) {
        const hit = getCachedCard(name);
        if (hit) {
          cached.set(name, hit);
        } else {
          uncachedNames.push(name);
        }
      }

      // Only call backend for uncached cards
      if (uncachedNames.length > 0) {
        const response = await fetch('/api/cards/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: uncachedNames.map((n) => `1 ${n}`).join('\n'),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed (${response.status})`);
        }

        const fetched: CardInfo[] = await response.json();
        cacheCards(fetched);
        for (const card of fetched) {
          const { quantity: _, ...cardData } = card;
          cached.set(card.name.toLowerCase(), cardData);
        }
      }

      // Build final list preserving original order and quantities
      const result: CardInfo[] = [];
      for (const entry of entries) {
        const card = cached.get(entry.name.toLowerCase());
        if (card) {
          result.push({ ...card, quantity: entry.quantity });
        }
      }

      setCards(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className='app'>
      <header>
        <h1>MTG Proxy Generator</h1>
      </header>

      <main className='no-print'>
        <DecklistInput onSubmit={handleSubmit} isLoading={isLoading} />

        {error && <div className='error'>{error}</div>}

        {cards.length > 0 && (
          <button className='print-button' onClick={handlePrint}>
            Print Proxies
          </button>
        )}

        <CardGrid cards={cards} />
      </main>

      <PrintView cards={cards} />
    </div>
  );
}
