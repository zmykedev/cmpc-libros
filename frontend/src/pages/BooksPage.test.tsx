import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { booksApi } from '../api/books';
import { book, catalogs } from '../test/fixtures';
import { BooksPage, toQuery } from './BooksPage';

vi.mock('../api/books', () => ({
  booksApi: { list: vi.fn(), catalogs: vi.fn(), exportCsv: vi.fn() },
}));
const api = vi.mocked(booksApi);

const page = (items = [book()], total = 1, totalPages = 1) => ({ items, meta: { total, page: 1, limit: 10, totalPages } });
const renderPage = () => render(<MemoryRouter><BooksPage /></MemoryRouter>);
const lastQuery = () => api.list.mock.calls.at(-1)![0];

describe('BooksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.list.mockResolvedValue(page());
    api.catalogs.mockResolvedValue(catalogs);
  });

  it('muestra los libros', async () => {
    renderPage();
    expect(await screen.findByText('Rayuela')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Julio Cortázar' })).toBeInTheDocument();
    expect(screen.getByText('1 libros')).toBeInTheDocument();
  });

  it('filtra por género y disponibilidad', async () => {
    renderPage();
    await screen.findByText('Rayuela');
    await screen.findByRole('option', { name: 'Novela' });
    await userEvent.selectOptions(screen.getByLabelText('Género'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Disponibilidad'), 'false');
    await waitFor(() => expect(lastQuery()).toMatchObject({ genreId: 1, available: false, page: 1 }));
    await userEvent.click(screen.getByText('Limpiar'));
    await waitFor(() => expect(lastQuery().genreId).toBeUndefined());
  });

  it('búsqueda con debounce', async () => {
    renderPage();
    await screen.findByText('Rayuela');
    await userEvent.type(screen.getByLabelText('Buscar'), 'bor');
    await waitFor(() => expect(lastQuery().search).toBe('bor'), { timeout: 1500 });
    expect(api.list.mock.calls.filter((c) => c[0].search).length).toBe(1);
  });

  it('ordena por múltiples columnas', async () => {
    renderPage();
    await screen.findByText('Rayuela');
    await userEvent.click(screen.getByRole('button', { name: 'Precio' }));
    await userEvent.click(screen.getByRole('button', { name: /^Género/ }));
    await waitFor(() => expect(lastQuery().sort).toBe('price:asc,genre:asc'));
    expect(screen.getByRole('button', { name: 'Precio ▲1' })).toBeInTheDocument();
  });

  it('pagina en el servidor', async () => {
    api.list.mockResolvedValue(page([book()], 25, 3));
    renderPage();
    await screen.findByText('Página 1 de 3');
    await userEvent.click(screen.getByText('Siguiente'));
    await waitFor(() => expect(lastQuery().page).toBe(2));
    await userEvent.click(screen.getByText('Anterior'));
    await waitFor(() => expect(lastQuery().page).toBe(1));
  });

  it('muestra estado vacío y errores', async () => {
    api.list.mockResolvedValueOnce(page([], 0, 0));
    renderPage();
    expect(await screen.findByText('No se encontraron libros')).toBeInTheDocument();
    api.list.mockRejectedValue(new Error('falló'));
    await userEvent.click(screen.getByRole('button', { name: 'Título' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('falló');
  });

  it('muestra error si fallan los catálogos', async () => {
    api.catalogs.mockRejectedValue(new Error('sin catálogos'));
    renderPage();
    expect(await screen.findByText('sin catálogos')).toBeInTheDocument();
  });

  it('exporta CSV con los filtros actuales', async () => {
    api.exportCsv.mockResolvedValue(new Blob(['a']));
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderPage();
    await screen.findByText('Rayuela');
    await userEvent.click(screen.getByText('Exportar CSV'));
    await waitFor(() => expect(click).toHaveBeenCalled());
    api.exportCsv.mockRejectedValue(new Error('no csv'));
    await userEvent.click(screen.getByText('Exportar CSV'));
    expect(await screen.findByText('no csv')).toBeInTheDocument();
  });

  it('toQuery convierte filtros', () => {
    expect(toQuery({ search: ' x ', genreId: '', publisherId: '2', authorId: '', available: 'true' }, [])).toEqual({
      search: 'x', genreId: undefined, publisherId: 2, authorId: undefined, available: true, sort: undefined,
    });
  });
});
