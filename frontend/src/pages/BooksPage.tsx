import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { booksApi, type Book, type BookQuery, type Catalogs, type Paginated } from '../api/books';
import { errorMessage } from '../api/client';
import { Alert } from '../components/Alert';
import { BookFilters, emptyFilters, type FilterValues } from '../components/BookFilters';
import { BookTable } from '../components/BookTable';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { sortToParam, toggleSort, type SortItem } from '../utils/sort';

const PAGE_SIZE = 10;
const num = (v: string) => (v ? Number(v) : undefined);

export function toQuery(f: FilterValues, sorts: SortItem[]): Omit<BookQuery, 'page' | 'limit'> {
  return {
    search: f.search.trim() || undefined,
    genreId: num(f.genreId),
    publisherId: num(f.publisherId),
    authorId: num(f.authorId),
    available: f.available === '' ? undefined : f.available === 'true',
    sort: sortToParam(sorts),
  };
}

export function BooksPage() {
  const [filters, setFilters] = useState<FilterValues>(emptyFilters);
  const [sorts, setSorts] = useState<SortItem[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Book> | null>(null);
  const [catalogs, setCatalogs] = useState<Catalogs>({ genres: [], publishers: [], authors: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(filters.search, 400);
  const query = toQuery({ ...filters, search: debouncedSearch }, sorts);
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    booksApi.catalogs().then(setCatalogs).catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => {
    let cancelled = false; // evita que una respuesta lenta pise a una más nueva
    setLoading(true);
    booksApi
      .list({ ...JSON.parse(queryKey), page, limit: PAGE_SIZE })
      .then((res) => !cancelled && (setData(res), setError(null)))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [queryKey, page]);

  const changeFilters = (f: FilterValues) => {
    setFilters(f);
    setPage(1);
  };

  const exportCsv = async () => {
    try {
      const blob = await booksApi.exportCsv(query);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'libros.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <section>
      <div className="page-head">
        <h1>Inventario</h1>
        <div className="actions">
          <button className="btn" onClick={exportCsv}>Exportar CSV</button>
          <Link className="btn primary" to="/books/new">Nuevo libro</Link>
        </div>
      </div>
      <BookFilters values={filters} catalogs={catalogs} onChange={changeFilters} />
      <Alert message={error} />
      <div className={loading ? 'loading' : undefined} aria-busy={loading}>
        <BookTable books={data?.items ?? []} sorts={sorts} onSort={(f) => (setSorts(toggleSort(sorts, f)), setPage(1))} />
      </div>
      {data && <Pagination page={page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />}
    </section>
  );
}
