import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TOKEN_KEY } from './api/client';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';

vi.mock('./pages/BooksPage', () => ({ BooksPage: () => <p>listado</p> }));

describe('App', () => {
  it('sin sesión muestra login', () => {
    localStorage.clear();
    render(<AuthProvider><MemoryRouter initialEntries={['/']}><App /></MemoryRouter></AuthProvider>);
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('con sesión muestra layout y permite cerrar sesión', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok');
    render(<AuthProvider><MemoryRouter initialEntries={['/']}><App /></MemoryRouter></AuthProvider>);
    expect(screen.getByText('listado')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cerrar sesión'));
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });
});
