import { render, screen } from '@testing-library/react';
import CardGrid from '~/components/CardGrid/CardGrid';
import { createCardInfo } from '~/test/helpers';

describe('CardGrid', () => {
  it('renders nothing when cards array is empty', () => {
    render(<CardGrid cards={[]} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders card images for each expanded card', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 3, imageUrl: 'bolt.jpg' })];
    render(<CardGrid cards={cards} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('renders multiple different cards expanded', () => {
    const cards = [
      createCardInfo({ name: 'Bolt', quantity: 2, imageUrl: 'bolt.jpg' }),
      createCardInfo({ name: 'Path', quantity: 1, imageUrl: 'path.jpg' }),
    ];
    render(<CardGrid cards={cards} />);

    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('passes correct props to CardImage', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 1, imageUrl: 'bolt.jpg' })];
    render(<CardGrid cards={cards} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'bolt.jpg');
    expect(img).toHaveAttribute('alt', 'Bolt');
  });

  it('renders placeholder for card without imageUrl', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 1, imageUrl: null })];
    render(<CardGrid cards={cards} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Bolt')).toBeInTheDocument();
  });

  it('sets lazy loading on images', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 1, imageUrl: 'bolt.jpg' })];
    render(<CardGrid cards={cards} />);

    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
  });
});
