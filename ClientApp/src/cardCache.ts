import type { CardInfo } from '~/types/card';

const CACHE_KEY = 'mtg-proxy-card-cache';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry = {
  card: Omit<CardInfo, 'quantity'>;
  cachedAt: number;
}

type CacheStore = Record<string, CacheEntry>;

function loadCache(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

function saveCache(store: CacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function getCachedCard(name: string): Omit<CardInfo, 'quantity'> | null {
  const store = loadCache();
  return getFromStore(store, name);
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

function getFromStore(store: CacheStore, name: string): Omit<CardInfo, 'quantity'> | null {
  const key = name.toLowerCase();
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    delete store[key];
    saveCache(store);
    return null;
  }
  return entry.card;
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
