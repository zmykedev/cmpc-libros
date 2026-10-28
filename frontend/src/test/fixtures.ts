import type { Book } from '../api/books';

export const book = (over: Partial<Book> = {}): Book => ({
  id: 1,
  title: 'Rayuela',
  price: 14990,
  available: true,
  imageUrl: null,
  author: { id: 1, name: 'Julio Cortázar' },
  publisher: { id: 1, name: 'Sudamericana' },
  genre: { id: 1, name: 'Novela' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...over,
});

export const catalogs = {
  genres: [{ id: 1, name: 'Novela' }],
  publishers: [{ id: 1, name: 'Sudamericana' }],
  authors: [{ id: 1, name: 'Julio Cortázar' }],
};
