import type { CardInfo } from '~/types/card';

export function createCardInfo(overrides: Partial<CardInfo> = {}): CardInfo {
  return {
    name: 'Lightning Bolt',
    quantity: 4,
    imageUrl: 'https://cards.scryfall.io/large/bolt.jpg',
    scryfallUrl: 'https://scryfall.com/card/bolt',
    setCode: 'lea',
    ...overrides,
  };
}
