import type { CardInfo } from '~/types/card';

export const MAX_QUANTITY = 100;
export const MAX_TOTAL_CARDS = 1000;

export type ExpandedCard = CardInfo & { key: string };

export function expandCards(cards: CardInfo[]): ExpandedCard[] {
  const result: ExpandedCard[] = [];
  for (const card of cards) {
    const qty = Math.min(Math.max(card.quantity, 0), MAX_QUANTITY);
    for (let i = 0; i < qty; i++) {
      if (result.length >= MAX_TOTAL_CARDS) return result;
      result.push({ ...card, key: `${card.name}-${i}` });
    }
  }
  return result;
}
