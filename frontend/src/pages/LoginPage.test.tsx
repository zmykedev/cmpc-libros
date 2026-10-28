import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

const login = vi.fn();
let isAuthenticated = false;
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ login, isAuthenticated }) }));

const renderPage = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

describe('LoginPage', () => {
  beforeEach(() => {
    login.mockReset();
    isAuthenticated = false;
  });

  it('valida campos antes de enviar', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText('Correo'), 'no-es-correo');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Correo inválido')).toBeInTheDocument();
    expect(screen.getByText('Mínimo 6 caracteres')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('envía credenciales y muestra error de la API', async () => {
    login.mockRejectedValue(new Error('Credenciales inválidas'));
    renderPage();
    await userEvent.type(screen.getByLabelText('Correo'), 'admin@cmpc.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(login).toHaveBeenCalledWith('admin@cmpc.cl', 'admin123');
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  });

  it('login exitoso', async () => {
    login.mockResolvedValue(undefined);
    renderPage();
    await userEvent.type(screen.getByLabelText('Correo'), 'admin@cmpc.cl');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('redirige si ya hay sesión', () => {
    isAuthenticated = true;
    renderPage();
    expect(screen.queryByText('Ingresar')).not.toBeInTheDocument();
  });
});
