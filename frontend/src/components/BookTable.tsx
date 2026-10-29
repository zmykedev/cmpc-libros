import { Link } from 'react-router-dom';
import type { Book } from '../api/books';
import { formatPrice, type SortItem } from '../utils/sort';

const COLUMNS = [
  { field: 'title', label: 'Título' },
  { field: 'author', label: 'Autor' },
  { field: 'publisher', label: 'Editorial' },
  { field: 'genre', label: 'Género' },
  { field: 'price', label: 'Precio', numeric: true },
  { field: 'available', label: 'Disponibilidad' },
];

interface Props {
  books: Book[];
  sorts: SortItem[];
  onSort: (field: string) => void;
  onClear?: () => void;
}

export function BookTable({ books, sorts, onSort, onClear }: Props) {
  const sortOf = (field: string) => {
    const i = sorts.findIndex((s) => s.field === field);
    return i < 0 ? null : { dir: sorts[i].dir, rank: sorts.length > 1 ? i + 1 : '' };
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((c) => {
              const s = sortOf(c.field);
              return (
                <th
                  key={c.field}
                  className={c.numeric ? 'num' : undefined}
                  aria-sort={s ? (s.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <button className={`th-btn${s ? ' is-sorted' : ''}`} onClick={() => onSort(c.field)}>
                    {c.label}{s && ` ${s.dir === 'asc' ? '▲' : '▼'}${s.rank}`}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {books.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="empty">
                <p>Ningún libro coincide con la búsqueda.</p>
                {onClear && <button className="btn" onClick={onClear}>Quitar filtros</button>}
              </td>
            </tr>
          )}
          {books.map((b) => (
            <tr key={b.id}>
              <td className="title-cell"><Link to={`/books/${b.id}`}>{b.title}</Link></td>
              <td>{b.author.name}</td>
              <td>{b.publisher.name}</td>
              <td>{b.genre.name}</td>
              <td className="num">{formatPrice(b.price)}</td>
              <td>
                <span className={`stock ${b.available ? 'in' : 'out'}`}>{b.available ? 'Disponible' : 'Agotado'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
