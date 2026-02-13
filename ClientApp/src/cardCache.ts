import type { CardInfo } from '~/types/card';

const CACHE_KEY = 'mtg-proxy-card-cache';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry = {
  card: Omit<CardInfo, 'quantity'>;
  cachedAt: number;
}

type CacheStore = Record<string, CacheEntry>;

let memo: CacheStore | null = null;

function loadCache(): CacheStore {
  if (memo) return memo;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      memo = {};
    } else {
      memo = JSON.parse(raw) as CacheStore;
    }
  } catch {
    memo = {};
  }
  return memo;
}

function saveCache(store: CacheStore): void {
  memo = store;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function getCachedCards(
  names: string[],
): Map<string, Omit<CardInfo, 'quantity'>> {
  const store = loadCache();
  const result = new Map<string, Omit<CardInfo, 'quantity'>>();
  let dirty = false;
  const now = Date.now();

  for (const name of names) {
    const key = name.toLowerCase();
    const entry = store[key];
    if (!entry) continue;
    if (now - entry.cachedAt > TTL_MS) {
      delete store[key];
      dirty = true;
    } else {
      result.set(key, entry.card);
    }
  }

  if (dirty) saveCache(store);
  return result;
}

export function cacheCards(cards: CardInfo[]): void {
  const store = loadCache();
  const now = Date.now();
  for (const card of cards) {
    const { quantity: _, ...cardData } = card;
    store[card.name.toLowerCase()] = { card: cardData, cachedAt: now };
  }
  saveCache(store);
}

export function clearMemo(): void {
  memo = null;
}
