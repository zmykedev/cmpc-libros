export type SortDir = 'asc' | 'desc';
export interface SortItem {
  field: string;
  dir: SortDir;
}

/** Ciclo por columna: sin orden → asc → desc → sin orden. Las columnas se acumulan (orden múltiple). */
export function toggleSort(sorts: SortItem[], field: string): SortItem[] {
  const current = sorts.find((s) => s.field === field);
  if (!current) return [...sorts, { field, dir: 'asc' }];
  if (current.dir === 'asc') return sorts.map((s) => (s.field === field ? { field, dir: 'desc' } : s));
  return sorts.filter((s) => s.field !== field);
}

export const sortToParam = (sorts: SortItem[]) => sorts.map((s) => `${s.field}:${s.dir}`).join(',') || undefined;

export const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
