import { api } from './client';

export interface NamedRef {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  title: string;
  price: number;
  available: boolean;
  imageUrl: string | null;
  author: NamedRef;
  publisher: NamedRef;
  genre: NamedRef;
  createdAt: string;
  updatedAt: string;
}

export interface BookInput {
  title: string;
  author: string;
  publisher: string;
  genre: string;
  price: number;
  available: boolean;
}

export interface BookQuery {
  page: number;
  limit: number;
  search?: string;
  genreId?: number;
  publisherId?: number;
  authorId?: number;
  available?: boolean;
  sort?: string;
}

export interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type Catalogs = { genres: NamedRef[]; publishers: NamedRef[]; authors: NamedRef[] };

/** Quita parámetros vacíos para no enviar "?genreId=" a la API. */
export const cleanParams = (q: object) =>
  Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== ''));

export const booksApi = {
  list: (q: BookQuery) => api.get<Paginated<Book>>('/books', { params: cleanParams(q) }).then((r) => r.data),
  get: (id: number) => api.get<Book>(`/books/${id}`).then((r) => r.data),
  create: (b: BookInput) => api.post<Book>('/books', b).then((r) => r.data),
  update: (id: number, b: Partial<BookInput>) => api.patch<Book>(`/books/${id}`, b).then((r) => r.data),
  remove: (id: number) => api.delete(`/books/${id}`).then((r) => r.data),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Book>(`/books/${id}/image`, form).then((r) => r.data);
  },
  exportCsv: (q: Omit<BookQuery, 'page' | 'limit'>) =>
    api.get<Blob>('/books/export', { params: cleanParams(q), responseType: 'blob' }).then((r) => r.data),
  catalogs: async (): Promise<Catalogs> => {
    const [genres, publishers, authors] = await Promise.all(
      ['genres', 'publishers', 'authors'].map((p) => api.get<NamedRef[]>(`/${p}`).then((r) => r.data)),
    );
    return { genres, publishers, authors };
  },
};

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<{ accessToken: string; user: { id: number; email: string; name: string } }>('/auth/login', { email, password })
      .then((r) => r.data),
};
