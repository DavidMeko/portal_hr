import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';

console.log('Renderer process started');

try {
  console.log('About to render React app');
  ReactDOM.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
    document.getElementById('root')
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering React app:', error);
}

const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: React does not recognize the') ||
     args[0].includes('Warning: Unknown event handler property'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};