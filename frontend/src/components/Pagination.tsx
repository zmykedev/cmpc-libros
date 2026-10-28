interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onChange }: Props) {
  return (
    <nav className="pagination" aria-label="Paginación">
      <span>{total} libros</span>
      <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span>Página {page} de {Math.max(totalPages, 1)}</span>
      <button className="btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</button>
    </nav>
  );
}
