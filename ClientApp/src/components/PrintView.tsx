import type { CardInfo } from "../types/card";

interface PrintViewProps {
  cards: CardInfo[];
}

export default function PrintView({ cards }: PrintViewProps) {
  if (cards.length === 0) return null;

  // Expand cards by quantity for printing
  const expandedCards = cards.flatMap((card) =>
    Array.from({ length: card.quantity }, (_, i) => ({ ...card, key: `${card.name}-${i}` }))
  );

  return (
    <div className="print-view">
      {expandedCards.map((card) => (
        <div key={card.key} className="print-card">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} />
          ) : (
            <div className="print-card-placeholder">{card.name}</div>
          )}
        </div>
      ))}
    </div>
  );
}
