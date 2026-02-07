import { parseDecklist } from '~/utils/parseDecklist';

describe('parseDecklist', () => {
  it('parses a standard entry', () => {
    const result = parseDecklist('4 Lightning Bolt');

    expect(result).toEqual([{ quantity: 4, name: 'Lightning Bolt' }]);
  });

  it('parses entry with lowercase x', () => {
    expect(parseDecklist('4x Lightning Bolt')).toEqual([
      { quantity: 4, name: 'Lightning Bolt' },
    ]);
  });

  it('parses entry with uppercase X', () => {
    expect(parseDecklist('4X Lightning Bolt')).toEqual([
      { quantity: 4, name: 'Lightning Bolt' },
    ]);
  });

  it('parses multiple entries', () => {
    const result = parseDecklist('4 Bolt\n2 Path\n1 Swords');

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ quantity: 4, name: 'Bolt' });
    expect(result[2]).toEqual({ quantity: 1, name: 'Swords' });
  });

  it('skips empty lines', () => {
    const result = parseDecklist('4 Bolt\n\n2 Path');

    expect(result).toHaveLength(2);
  });

  it('skips // comments', () => {
    const result = parseDecklist('// comment\n4 Bolt');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bolt');
  });

  it('skips # comments', () => {
    const result = parseDecklist('# sideboard\n2 Path');

    expect(result).toHaveLength(1);
  });

  it('skips invalid lines', () => {
    const result = parseDecklist('not valid\n4 Bolt');

    expect(result).toHaveLength(1);
  });

  it('returns empty array for empty string', () => {
    expect(parseDecklist('')).toEqual([]);
  });

  it('trims whitespace from card names', () => {
    const result = parseDecklist('4 Lightning Bolt   ');

    expect(result[0].name).toBe('Lightning Bolt');
  });
});
