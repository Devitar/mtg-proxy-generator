import { render, screen } from '@testing-library/react';
import CardImage from '~/components/CardImage/CardImage';

describe('CardImage', () => {
  it('renders img when imageUrl is provided', () => {
    render(<CardImage name="Bolt" imageUrl="http://img.jpg" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'http://img.jpg');
    expect(img).toHaveAttribute('alt', 'Bolt');
  });

  it('renders placeholder div when imageUrl is null', () => {
    render(<CardImage name="Bolt" imageUrl={null} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Bolt')).toBeInTheDocument();
  });

  it('applies className to img', () => {
    render(<CardImage name="Bolt" imageUrl="http://img.jpg" className="my-class" />);

    expect(screen.getByRole('img')).toHaveClass('my-class');
  });

  it('applies placeholderClassName to placeholder div', () => {
    render(<CardImage name="Bolt" imageUrl={null} placeholderClassName="ph-class" />);

    expect(screen.getByText('Bolt')).toHaveClass('ph-class');
  });

  it('sets loading=lazy when lazy prop is true', () => {
    render(<CardImage name="Bolt" imageUrl="http://img.jpg" lazy />);

    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
  });

  it('does not set loading attribute when lazy is undefined', () => {
    render(<CardImage name="Bolt" imageUrl="http://img.jpg" />);

    expect(screen.getByRole('img')).not.toHaveAttribute('loading');
  });

  it('renders placeholder when imageUrl is empty string', () => {
    render(<CardImage name="Bolt" imageUrl="" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Bolt')).toBeInTheDocument();
  });
});
