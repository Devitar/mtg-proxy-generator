import { expandCards, MAX_QUANTITY, MAX_TOTAL_CARDS } from '~/utils/expandCards';
import { createCardInfo } from '~/test/helpers';

describe('expandCards', () => {
  it('returns empty array for empty input', () => {
    expect(expandCards([])).toEqual([]);
  });

  it('expands a single card with quantity 1', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 1 })];
    const result = expandCards(cards);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('Bolt-0');
    expect(result[0].name).toBe('Bolt');
  });

  it('expands a single card with quantity 4', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 4 })];
    const result = expandCards(cards);

    expect(result).toHaveLength(4);
    expect(result.map((c) => c.key)).toEqual(['Bolt-0', 'Bolt-1', 'Bolt-2', 'Bolt-3']);
  });

  it('expands multiple cards', () => {
    const cards = [
      createCardInfo({ name: 'Bolt', quantity: 2 }),
      createCardInfo({ name: 'Path', quantity: 3 }),
    ];
    const result = expandCards(cards);

    expect(result).toHaveLength(5);
  });

  it('preserves all card properties', () => {
    const card = createCardInfo({
      name: 'Bolt',
      quantity: 1,
      imageUrl: 'http://img.jpg',
      scryfallUrl: 'http://scryfall.com',
      setCode: 'lea',
    });
    const result = expandCards([card]);

    expect(result[0]).toMatchObject({
      name: 'Bolt',
      quantity: 1,
      imageUrl: 'http://img.jpg',
      scryfallUrl: 'http://scryfall.com',
      setCode: 'lea',
    });
  });

  it('handles quantity 0', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 0 })];
    const result = expandCards(cards);

    expect(result).toHaveLength(0);
  });

  it('generates unique keys across different cards', () => {
    const cards = [
      createCardInfo({ name: 'Bolt', quantity: 2 }),
      createCardInfo({ name: 'Path', quantity: 2 }),
    ];
    const result = expandCards(cards);
    const keys = result.map((c) => c.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('caps quantity at MAX_QUANTITY', () => {
    const cards = [createCardInfo({ name: 'Mountain', quantity: 999999 })];
    const result = expandCards(cards);

    expect(result).toHaveLength(MAX_QUANTITY);
  });

  it('does not cap quantity at or below MAX_QUANTITY', () => {
    const cards = [createCardInfo({ name: 'Mountain', quantity: MAX_QUANTITY })];
    const result = expandCards(cards);

    expect(result).toHaveLength(MAX_QUANTITY);
  });

  it('treats negative quantity as 0', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: -5 })];
    const result = expandCards(cards);

    expect(result).toHaveLength(0);
  });

  it('caps total expanded cards at MAX_TOTAL_CARDS', () => {
    const cards = Array.from({ length: 20 }, (_, i) =>
      createCardInfo({ name: `Card${i}`, quantity: MAX_QUANTITY }),
    );
    const result = expandCards(cards);

    expect(result).toHaveLength(MAX_TOTAL_CARDS);
  });
});
