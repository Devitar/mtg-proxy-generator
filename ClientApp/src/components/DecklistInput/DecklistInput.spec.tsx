import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DecklistInput from '~/components/DecklistInput/DecklistInput';

describe('DecklistInput', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea and submit button', () => {
    render(<DecklistInput {...defaultProps} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate proxies/i })).toBeInTheDocument();
  });

  it('submit button is disabled when textarea is empty', () => {
    render(<DecklistInput {...defaultProps} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('submit button is enabled when textarea has content', async () => {
    const user = userEvent.setup();
    render(<DecklistInput {...defaultProps} />);

    await user.type(screen.getByRole('textbox'), '4 Lightning Bolt');

    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('calls onSubmit with textarea value on form submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<DecklistInput onSubmit={onSubmit} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button'));

    expect(onSubmit).toHaveBeenCalledWith('4 Lightning Bolt');
  });

  it('textarea is disabled when isLoading is true', () => {
    render(<DecklistInput {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('submit button is disabled when isLoading is true', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DecklistInput {...defaultProps} />);

    await user.type(screen.getByRole('textbox'), '4 Lightning Bolt');
    rerender(<DecklistInput {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('submit button shows Loading text when isLoading', () => {
    render(<DecklistInput {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button')).toHaveTextContent('Loading...');
  });

  it('submit button shows Generate Proxies when not loading', () => {
    render(<DecklistInput {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveTextContent('Generate Proxies');
  });

  it('textarea has correct placeholder', () => {
    render(<DecklistInput {...defaultProps} />);

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      expect.stringContaining('Lightning Bolt'),
    );
  });

  it('textarea has aria-label Decklist', () => {
    render(<DecklistInput {...defaultProps} />);

    expect(screen.getByLabelText('Decklist')).toBeInTheDocument();
  });

  it('textarea has maxLength 10000', () => {
    render(<DecklistInput {...defaultProps} />);

    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10000');
  });
});
