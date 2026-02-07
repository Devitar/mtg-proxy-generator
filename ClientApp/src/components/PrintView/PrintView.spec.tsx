import { render, screen } from '@testing-library/react';
import PrintView from '~/components/PrintView/PrintView';
import { createCardInfo } from '~/test/helpers';

describe('PrintView', () => {
  it('renders nothing when cards array is empty', () => {
    render(<PrintView cards={[]} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders expanded cards', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 2, imageUrl: 'bolt.jpg' })];
    render(<PrintView cards={cards} />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('does not set lazy loading on images', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 1, imageUrl: 'bolt.jpg' })];
    render(<PrintView cards={cards} />);

    expect(screen.getByRole('img')).not.toHaveAttribute('loading');
  });

  it('has print-view class on container', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 1, imageUrl: 'bolt.jpg' })];
    render(<PrintView cards={cards} />);

    expect(screen.getByRole('list')).toHaveClass('print-view');
  });

  it('renders placeholder for card without imageUrl', () => {
    const cards = [createCardInfo({ name: 'Bolt', quantity: 1, imageUrl: null })];
    render(<PrintView cards={cards} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Bolt')).toBeInTheDocument();
  });
});
