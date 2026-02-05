import type { CardInfo } from '../types/';

type Props = {
  cards: CardInfo[];
};

export default function CardGrid({ cards }: Props) {
  if (cards.length === 0) return null;

  // Expand cards by quantity for display
  const expandedCards = cards.flatMap((card) =>
    Array.from({ length: card.quantity }, (_, i) => ({ ...card, key: `${card.name}-${i}` }))
  );

  return (
    <div className='card-grid'>
      {expandedCards.map((card) => (
        <div key={card.key} className='card-item'>
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} loading='lazy' />
          ) : (
            <div className='card-placeholder'>{card.name}</div>
          )}
        </div>
      ))}
    </div>
  );
}
