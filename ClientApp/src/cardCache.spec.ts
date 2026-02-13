import { getCachedCards, cacheCards, clearMemo } from '~/cardCache';
import { createCardInfo } from '~/test/helpers';

function getCachedCard(name: string) {
  const result = getCachedCards([name]);
  return result.get(name.toLowerCase()) ?? null;
}

describe('cardCache', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMemo();
    vi.restoreAllMocks();
  });

  it('returns null for uncached card', () => {
    expect(getCachedCard('Lightning Bolt')).toBeNull();
  });

  it('cacheCards stores and retrieves a card', () => {
    const card = createCardInfo({ name: 'Lightning Bolt', quantity: 4 });
    cacheCards([card]);

    const cached = getCachedCard('Lightning Bolt');
    expect(cached).not.toBeNull();
    expect(cached!.name).toBe('Lightning Bolt');
    expect(cached!.imageUrl).toBe(card.imageUrl);
  });

  it('cached result omits quantity', () => {
    cacheCards([createCardInfo({ name: 'Bolt', quantity: 4 })]);

    const cached = getCachedCard('Bolt');
    expect(cached).not.toHaveProperty('quantity');
  });

  it('lookup is case insensitive', () => {
    cacheCards([createCardInfo({ name: 'Lightning Bolt' })]);

    expect(getCachedCard('lightning bolt')).not.toBeNull();
    expect(getCachedCard('LIGHTNING BOLT')).not.toBeNull();
  });

  it('returns null for expired entry', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    cacheCards([createCardInfo({ name: 'Bolt' })]);

    // Advance time past 24-hour TTL
    clearMemo();
    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 + 1);

    expect(getCachedCard('Bolt')).toBeNull();
  });

  it('removes expired entry from store', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    cacheCards([createCardInfo({ name: 'Bolt' })]);

    clearMemo();
    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 + 1);
    getCachedCard('Bolt');

    // Reset time and check entry was removed
    clearMemo();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    expect(getCachedCard('Bolt')).toBeNull();
  });

  it('cacheCards stores multiple cards', () => {
    cacheCards([
      createCardInfo({ name: 'Bolt' }),
      createCardInfo({ name: 'Path' }),
      createCardInfo({ name: 'Swords' }),
    ]);

    expect(getCachedCard('Bolt')).not.toBeNull();
    expect(getCachedCard('Path')).not.toBeNull();
    expect(getCachedCard('Swords')).not.toBeNull();
  });

  it('cacheCards overwrites existing entry', () => {
    cacheCards([createCardInfo({ name: 'Bolt', imageUrl: 'old.jpg' })]);
    cacheCards([createCardInfo({ name: 'Bolt', imageUrl: 'new.jpg' })]);

    expect(getCachedCard('Bolt')!.imageUrl).toBe('new.jpg');
  });

  it('returns null when localStorage has invalid JSON', () => {
    localStorage.setItem('mtg-proxy-card-cache', 'not valid json');

    expect(getCachedCard('Bolt')).toBeNull();
  });

  it('cacheCards silently handles localStorage.setItem throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => cacheCards([createCardInfo({ name: 'Bolt' })])).not.toThrow();
  });

  describe('getCachedCards (bulk)', () => {
    it('returns a map of cached cards', () => {
      cacheCards([createCardInfo({ name: 'Bolt' }), createCardInfo({ name: 'Path' })]);

      const result = getCachedCards(['bolt', 'path']);

      expect(result.size).toBe(2);
      expect(result.get('bolt')!.name).toBe('Bolt');
      expect(result.get('path')!.name).toBe('Path');
    });

    it('omits uncached names from the result', () => {
      cacheCards([createCardInfo({ name: 'Bolt' })]);

      const result = getCachedCards(['bolt', 'missing']);

      expect(result.size).toBe(1);
      expect(result.has('missing')).toBe(false);
    });

    it('omits expired entries and cleans them from store', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      cacheCards([createCardInfo({ name: 'Bolt' }), createCardInfo({ name: 'Path' })]);

      clearMemo();
      vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 + 1);

      const result = getCachedCards(['bolt', 'path']);
      expect(result.size).toBe(0);

      // Verify expired entries were removed from storage
      clearMemo();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      expect(getCachedCard('bolt')).toBeNull();
    });

    it('parses localStorage only once for multiple lookups', () => {
      cacheCards([createCardInfo({ name: 'Bolt' }), createCardInfo({ name: 'Path' })]);
      clearMemo();

      const spy = vi.spyOn(Storage.prototype, 'getItem');
      getCachedCards(['bolt', 'path', 'swords']);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('uses memoized cache on second call without hitting localStorage', () => {
      cacheCards([createCardInfo({ name: 'Bolt' })]);

      const spy = vi.spyOn(Storage.prototype, 'getItem');
      getCachedCards(['bolt']);
      getCachedCards(['bolt']);

      expect(spy).not.toHaveBeenCalled();
    });

    it('returns empty map for empty input', () => {
      const result = getCachedCards([]);

      expect(result.size).toBe(0);
    });
  });
});
