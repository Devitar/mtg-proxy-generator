import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '~/App';
import { clearMemo } from '~/cardCache';

function mockFetchSuccess(cards: Array<{ name: string; imageUrl?: string }>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        data: cards.map((c) => ({
          name: c.name,
          quantity: 1,
          imageUrl: c.imageUrl ?? `https://img/${c.name}.jpg`,
          scryfallUrl: `https://scryfall.com/${c.name}`,
          setCode: 'test',
        })),
      }),
  });
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMemo();
    vi.restoreAllMocks();
  });

  it('renders the page title and decklist input', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'MTG Proxy Generator' })).toBeInTheDocument();
    expect(screen.getByLabelText('Decklist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate proxies/i })).toBeInTheDocument();
  });

  it('shows error when decklist has no valid entries', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), 'invalid text');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('No valid card entries found');
  });

  it('calls fetch with correct payload for uncached cards', async () => {
    const fetchMock = mockFetchSuccess([{ name: 'lightning bolt' }]);
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/cards/parse',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('lightning bolt'),
        }),
      );
    });
  });

  it('displays cards after successful fetch', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess([{ name: 'lightning bolt' }]));

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });
  });

  it('shows error message on fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request error' }),
      }),
    );

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Bad request error');
    });
  });

  it('shows error message on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch');
    });
  });

  it('displays Print Proxies button when cards are loaded', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess([{ name: 'lightning bolt' }]));

    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('button', { name: /print proxies/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print proxies/i })).toBeInTheDocument();
    });
  });

  it('uses cached cards and does not call fetch', async () => {
    // Pre-populate cache
    const cacheStore = {
      'lightning bolt': {
        card: {
          name: 'lightning bolt',
          imageUrl: 'cached.jpg',
          scryfallUrl: 'cached-url',
          setCode: 'test',
        },
        cachedAt: Date.now(),
      },
    };
    localStorage.setItem('mtg-proxy-card-cache', JSON.stringify(cacheStore));

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('caches fetched cards in localStorage', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess([{ name: 'lightning bolt' }]));

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      const raw = localStorage.getItem('mtg-proxy-card-cache');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed['lightning bolt']).toBeDefined();
    });
  });

  it('shows warning for cards not found by backend', async () => {
    // Backend only returns "lightning bolt", not "ligthning bolt" (misspelled)
    vi.stubGlobal('fetch', mockFetchSuccess([{ name: 'lightning bolt' }]));

    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByLabelText('Decklist'),
      '4 Lightning Bolt\n2 card that does not exist',
    );
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Cards not found: card that does not exist',
      );
    });
  });

  it('does not show warning when all cards are found', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSuccess([{ name: 'lightning bolt' }, { name: 'path to exile' }]),
    );

    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByLabelText('Decklist'),
      '4 Lightning Bolt\n2 Path to Exile',
    );
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows loading state during fetch', async () => {
    let resolveResponse!: (value: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
      ),
    );

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Decklist'), '4 Lightning Bolt');
    await user.click(screen.getByRole('button', { name: /generate proxies/i }));

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();

    resolveResponse({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              name: 'lightning bolt',
              quantity: 1,
              imageUrl: 'img.jpg',
              scryfallUrl: 'url',
              setCode: 'test',
            },
          ],
        }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate proxies/i })).toBeEnabled();
    });
  });
});
