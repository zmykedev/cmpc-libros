import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { booksApi } from '../api/books';
import { book, catalogs } from '../test/fixtures';
import { BookFormPage, validateImage } from './BookFormPage';

vi.mock('../api/books', () => ({
  booksApi: { get: vi.fn(), create: vi.fn(), update: vi.fn(), uploadImage: vi.fn(), catalogs: vi.fn() },
}));
const api = vi.mocked(booksApi);

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/books/new" element={<BookFormPage />} />
        <Route path="/books/:id/edit" element={<BookFormPage />} />
        <Route path="/books/:id" element={<p>detalle</p>} />
      </Routes>
    </MemoryRouter>,
  );

async function fill() {
  await userEvent.type(screen.getByLabelText('Título'), 'Nuevo');
  await userEvent.type(screen.getByLabelText('Autor'), 'Autor X');
  await userEvent.type(screen.getByLabelText('Editorial'), 'Ed');
  await userEvent.type(screen.getByLabelText('Género'), 'Novela');
  await userEvent.clear(screen.getByLabelText('Precio (CLP)'));
  await userEvent.type(screen.getByLabelText('Precio (CLP)'), '9990');
}

describe('BookFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.catalogs.mockResolvedValue(catalogs);
    api.create.mockResolvedValue(book({ id: 5 }));
    api.update.mockResolvedValue(book());
    api.get.mockResolvedValue(book({ imageUrl: '/uploads/a.png' }));
  });

  it('validación reactiva: muestra errores y deshabilita guardar', async () => {
    renderAt('/books/new');
    const title = screen.getByLabelText('Título');
    await userEvent.type(title, 'a');
    await userEvent.clear(title);
    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear libro' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Precio (CLP)'), '-');
    await userEvent.clear(screen.getByLabelText('Precio (CLP)'));
    expect(await screen.findByText('Ingresa un precio válido')).toBeInTheDocument();
  });

  it('crea un libro con imagen', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    renderAt('/books/new');
    await fill();
    const file = new File(['img'], 'tapa.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText(/Portada/), file);
    expect(screen.getByAltText('Vista previa')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));
    await waitFor(() => expect(api.create).toHaveBeenCalledWith(
      { title: 'Nuevo', author: 'Autor X', publisher: 'Ed', genre: 'Novela', price: 9990, available: true },
    ));
    expect(api.uploadImage).toHaveBeenCalledWith(5, file);
    expect(await screen.findByText('detalle')).toBeInTheDocument();
  });

  it('edita un libro existente', async () => {
    renderAt('/books/1/edit');
    await waitFor(() => expect(screen.getByLabelText('Título')).toHaveValue('Rayuela'));
    expect(screen.getByAltText('Vista previa')).toHaveAttribute('src', '/uploads/a.png');
    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.type(screen.getByLabelText('Título'), 'Rayuela 2');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Rayuela 2' })));
    expect(api.uploadImage).not.toHaveBeenCalled();
  });

  it('muestra errores de la API al guardar y al cargar', async () => {
    api.create.mockRejectedValue(new Error('ya existe'));
    renderAt('/books/new');
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ya existe');
  });

  it('error al cargar libro', async () => {
    api.get.mockRejectedValue(new Error('no encontrado'));
    renderAt('/books/9/edit');
    expect(await screen.findByRole('alert')).toHaveTextContent('no encontrado');
  });

  it('rechaza imágenes inválidas', async () => {
    renderAt('/books/new');
    await userEvent.upload(screen.getByLabelText(/Portada/), new File(['x'], 'a.gif', { type: 'image/gif' }), { applyAccept: false });
    expect(screen.getByText('Formato no permitido (jpg, png, webp)')).toBeInTheDocument();
  });

  it('validateImage', () => {
    expect(validateImage(undefined)).toBeNull();
    const big = new File([new Uint8Array(3 * 1024 * 1024)], 'b.png', { type: 'image/png' });
    expect(validateImage(big)).toMatch(/supera/);
  });
});
