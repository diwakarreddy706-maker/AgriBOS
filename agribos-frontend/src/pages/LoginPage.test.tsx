import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/admin or mobile/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeDefined();
  });
});
