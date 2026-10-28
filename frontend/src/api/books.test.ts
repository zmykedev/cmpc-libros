import { api } from './client';
import { authApi, booksApi } from './books';

vi.mock('./client', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
const m = api as unknown as Record<'get' | 'post' | 'patch' | 'delete', ReturnType<typeof vi.fn>>;

describe('booksApi', () => {
  beforeEach(() => Object.values(m).forEach((f) => f.mockResolvedValue({ data: 'ok' })));

  it('llama a los endpoints correctos', async () => {
    await booksApi.list({ page: 1, limit: 10, search: '' });
    expect(m.get).toHaveBeenCalledWith('/books', { params: { page: 1, limit: 10 } });
    await booksApi.get(3);
    expect(m.get).toHaveBeenCalledWith('/books/3');
    await booksApi.create({ title: 't', author: 'a', publisher: 'p', genre: 'g', price: 1, available: true });
    await booksApi.update(3, { price: 2 });
    expect(m.patch).toHaveBeenCalledWith('/books/3', { price: 2 });
    await booksApi.remove(3);
    expect(m.delete).toHaveBeenCalledWith('/books/3');
    await booksApi.uploadImage(3, new File(['x'], 'a.png'));
    expect(m.post).toHaveBeenCalledWith('/books/3/image', expect.any(FormData));
    await booksApi.exportCsv({ genreId: 1 });
    expect(m.get).toHaveBeenCalledWith('/books/export', { params: { genreId: 1 }, responseType: 'blob' });
    await expect(booksApi.catalogs()).resolves.toEqual({ genres: 'ok', publishers: 'ok', authors: 'ok' });
    await authApi.login('a@b.cl', '123456');
    expect(m.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.cl', password: '123456' });
  });
});
