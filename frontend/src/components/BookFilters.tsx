import type { Catalogs } from '../api/books';

export interface FilterValues {
  search: string;
  genreId: string;
  publisherId: string;
  authorId: string;
  available: string;
}

export const emptyFilters: FilterValues = { search: '', genreId: '', publisherId: '', authorId: '', available: '' };

interface Props {
  values: FilterValues;
  catalogs: Catalogs;
  onChange: (values: FilterValues) => void;
}

export function BookFilters({ values, catalogs, onChange }: Props) {
  const set = (key: keyof FilterValues) => (e: { target: { value: string } }) => onChange({ ...values, [key]: e.target.value });

  const select = (key: 'genreId' | 'publisherId' | 'authorId', label: string, items: Catalogs['genres']) => (
    <select aria-label={label} value={values[key]} onChange={set(key)}>
      <option value="">{label}: todos</option>
      {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
    </select>
  );

  return (
    <div className="filters">
      <input type="search" placeholder="Buscar por título o autor…" aria-label="Buscar" value={values.search} onChange={set('search')} />
      {select('genreId', 'Género', catalogs.genres)}
      {select('publisherId', 'Editorial', catalogs.publishers)}
      {select('authorId', 'Autor', catalogs.authors)}
      <select aria-label="Disponibilidad" value={values.available} onChange={set('available')}>
        <option value="">Disponibilidad: todas</option>
        <option value="true">Disponible</option>
        <option value="false">No disponible</option>
      </select>
      <button className="btn ghost" onClick={() => onChange(emptyFilters)}>Limpiar</button>
    </div>
  );
}
