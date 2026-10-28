import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { authApi } from '../api/books';
import { TOKEN_KEY } from '../api/client';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('../api/books', () => ({ authApi: { login: vi.fn() } }));

function Probe() {
  const { isAuthenticated, login, logout } = useAuth();
  return (
    <>
      <span>{isAuthenticated ? 'in' : 'out'}</span>
      <button onClick={() => login('a@b.cl', '123456')}>login</button>
      <button onClick={logout}>logout</button>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear());

  it('login guarda el token y logout lo borra', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'tok', user: { id: 1, email: 'a', name: 'A' } });
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText('out')).toBeInTheDocument();
    await act(() => screen.getByText('login').click());
    expect(screen.getByText('in')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok');
    act(() => screen.getByText('logout').click());
    expect(screen.getByText('out')).toBeInTheDocument();
  });

  it('cierra sesión al recibir el evento auth:logout', () => {
    localStorage.setItem(TOKEN_KEY, 'tok');
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => window.dispatchEvent(new Event('auth:logout')));
    expect(screen.getByText('out')).toBeInTheDocument();
  });

  it('useAuth fuera del provider lanza error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow();
  });

  it('ProtectedRoute redirige a /login sin sesión', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/login" element={<p>login page</p>} />
            <Route element={<ProtectedRoute />}><Route path="/" element={<p>privado</p>} /></Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
});
