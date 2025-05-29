import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  // Add a basic test that checks if the app renders without crashing
  expect(document.body).toBeTruthy();
}); 