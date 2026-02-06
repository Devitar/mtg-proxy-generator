import type { CardInfo } from '~/types/card';

export type ExpandedCard = CardInfo & { key: string };

export function expandCards(cards: CardInfo[]): ExpandedCard[] {
  return cards.flatMap((card) =>
    Array.from({ length: card.quantity }, (_, i) => ({ ...card, key: `${card.name}-${i}` }))
  );
}
