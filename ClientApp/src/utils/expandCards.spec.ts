import { expandCards } from '~/utils/expandCards';
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
});
