import type { CardInfo } from '~/types/';
import { expandCards } from '~/utils/expandCards';
import { CardImage } from '~/components';
import './CardGrid.css';

type Props = {
  cards: CardInfo[];
};

export default function CardGrid({ cards }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className='card-grid'>
      {expandCards(cards).map((card) => (
        <div key={card.key} className='card-item'>
          <CardImage name={card.name} imageUrl={card.imageUrl} placeholderClassName='card-placeholder' lazy />
        </div>
      ))}
    </div>
  );
}
