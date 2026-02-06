import type { CardInfo } from '~/types/card';

export const MAX_QUANTITY = 100;

export type ExpandedCard = CardInfo & { key: string };

export function expandCards(cards: CardInfo[]): ExpandedCard[] {
  return cards.flatMap((card) => {
    const qty = Math.min(Math.max(card.quantity, 0), MAX_QUANTITY);
    return Array.from({ length: qty }, (_, i) => ({ ...card, key: `${card.name}-${i}` }));
  });
}
