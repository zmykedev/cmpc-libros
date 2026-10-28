import { Link } from 'react-router-dom';
import type { Book } from '../api/books';
import { formatPrice, type SortItem } from '../utils/sort';

const COLUMNS = [
  { field: 'title', label: 'Título' },
  { field: 'author', label: 'Autor' },
  { field: 'publisher', label: 'Editorial' },
  { field: 'genre', label: 'Género' },
  { field: 'price', label: 'Precio' },
  { field: 'available', label: 'Disponibilidad' },
];

interface Props {
  books: Book[];
  sorts: SortItem[];
  onSort: (field: string) => void;
}

export function BookTable({ books, sorts, onSort }: Props) {
  const indicator = (field: string) => {
    const i = sorts.findIndex((s) => s.field === field);
    if (i < 0) return '';
    return ` ${sorts[i].dir === 'asc' ? '▲' : '▼'}${sorts.length > 1 ? i + 1 : ''}`;
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.field}>
                <button className="th-btn" onClick={() => onSort(c.field)}>{c.label}{indicator(c.field)}</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {books.length === 0 && (
            <tr><td colSpan={COLUMNS.length} className="empty">No se encontraron libros</td></tr>
          )}
          {books.map((b) => (
            <tr key={b.id}>
              <td><Link to={`/books/${b.id}`}>{b.title}</Link></td>
              <td>{b.author.name}</td>
              <td>{b.publisher.name}</td>
              <td>{b.genre.name}</td>
              <td>{formatPrice(b.price)}</td>
              <td><span className={`badge ${b.available ? 'ok' : 'no'}`}>{b.available ? 'Disponible' : 'Agotado'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
