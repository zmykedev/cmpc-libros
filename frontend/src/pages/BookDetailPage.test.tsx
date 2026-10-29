import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { booksApi } from '../api/books';
import { book } from '../test/fixtures';
import { BookDetailPage, catalogName } from './BookDetailPage';

vi.mock('../api/books', () => ({ booksApi: { get: vi.fn(), remove: vi.fn() } }));
const api = vi.mocked(booksApi);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/books/1']}>
      <Routes>
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/" element={<p>listado</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('BookDetailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra todos los datos del libro', async () => {
    api.get.mockResolvedValue(book({ imageUrl: '/uploads/a.png', available: false }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Rayuela' })).toBeInTheDocument();
    expect(screen.getByText('Julio Cortázar')).toBeInTheDocument();
    expect(screen.getByText('Sudamericana')).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/uploads/a.png');
  });

  it('elimina tras confirmar', async () => {
    api.get.mockResolvedValue(book());
    api.remove.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    expect(await screen.findByText('Sin imagen')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Eliminar'));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1));
    expect(await screen.findByText('listado')).toBeInTheDocument();
  });

  it('no elimina si se cancela y muestra errores', async () => {
    api.get.mockResolvedValue(book());
    api.remove.mockRejectedValue(new Error('no se pudo'));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage();
    await userEvent.click(await screen.findByText('Eliminar'));
    expect(api.remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByText('Eliminar'));
    expect(await screen.findByRole('alert')).toHaveTextContent('no se pudo');
  });

  it('catalogName invierte nombre y apellidos', () => {
    expect(catalogName('Julio Cortázar')).toBe('Cortázar, Julio');
    expect(catalogName('Gabriel García Márquez')).toBe('García Márquez, Gabriel');
    expect(catalogName('Platón')).toBe('Platón');
  });

  it('muestra error si no existe', async () => {
    api.get.mockRejectedValue(new Error('Libro 1 no encontrado'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('no encontrado');
  });
});
