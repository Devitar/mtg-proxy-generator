import { useState } from 'react';
import './DecklistInput.css';

type Props = {
  onSubmit: (decklist: string) => void;
  isLoading: boolean;
};

const PLACEHOLDER = `4 Lightning Bolt
4 Counterspell
2 Black Lotus
1 Ancestral Recall`;

export default function DecklistInput({ onSubmit, isLoading }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='decklist-input'>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        aria-label='Decklist'
        rows={12}
        maxLength={10000}
        disabled={isLoading}
      />
      <button type='submit' disabled={isLoading || !text.trim()}>
        {isLoading ? 'Loading...' : 'Generate Proxies'}
      </button>
    </form>
  );
}
