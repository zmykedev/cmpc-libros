interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onChange }: Props) {
  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="count">{total === 1 ? '1 libro' : `${total} libros`}</span>
      <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span className="page-of">Página {page} de {Math.max(totalPages, 1)}</span>
      <button className="btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</button>
    </nav>
  );
}
