import { getCachedCard, cacheCards } from '~/cardCache';
import { createCardInfo } from '~/test/helpers';

describe('cardCache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('getCachedCard returns null for uncached card', () => {
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

  it('getCachedCard omits quantity from cached result', () => {
    cacheCards([createCardInfo({ name: 'Bolt', quantity: 4 })]);

    const cached = getCachedCard('Bolt');
    expect(cached).not.toHaveProperty('quantity');
  });

  it('getCachedCard is case insensitive', () => {
    cacheCards([createCardInfo({ name: 'Lightning Bolt' })]);

    expect(getCachedCard('lightning bolt')).not.toBeNull();
    expect(getCachedCard('LIGHTNING BOLT')).not.toBeNull();
  });

  it('getCachedCard returns null for expired entry', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    cacheCards([createCardInfo({ name: 'Bolt' })]);

    // Advance time past 24-hour TTL
    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 + 1);

    expect(getCachedCard('Bolt')).toBeNull();
  });

  it('getCachedCard removes expired entry from store', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    cacheCards([createCardInfo({ name: 'Bolt' })]);

    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 + 1);
    getCachedCard('Bolt');

    // Reset time and check entry was removed
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

  it('getCachedCard returns null when localStorage has invalid JSON', () => {
    localStorage.setItem('mtg-proxy-card-cache', 'not valid json');

    expect(getCachedCard('Bolt')).toBeNull();
  });

  it('cacheCards silently handles localStorage.setItem throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => cacheCards([createCardInfo({ name: 'Bolt' })])).not.toThrow();
  });
});
