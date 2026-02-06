import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='app'>
          <header>
            <h1>MTG Proxy Generator</h1>
          </header>
          <div className='error'>
            Something went wrong. Please refresh the page and try again.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
