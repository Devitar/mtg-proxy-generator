import type { CardInfo } from '~/types/card';
import { expandCards } from '~/utils/expandCards';
import { CardImage } from '~/components';
import './PrintView.css';

type Props = {
  cards: CardInfo[];
};

export default function PrintView({ cards }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className='print-view'>
      {expandCards(cards).map((card) => (
        <div key={card.key} className='print-card'>
          <CardImage name={card.name} imageUrl={card.imageUrl} placeholderClassName='print-card-placeholder' />
        </div>
      ))}
    </div>
  );
}
