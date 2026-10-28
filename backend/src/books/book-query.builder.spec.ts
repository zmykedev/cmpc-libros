import { buildBookOrderBy, buildBookWhere } from './book-query.builder';

describe('buildBookWhere', () => {
  it('siempre excluye eliminados', () => {
    expect(buildBookWhere({})).toEqual({ deletedAt: null });
  });

  it('aplica todos los filtros', () => {
    const w = buildBookWhere({ genreId: 1, publisherId: 2, authorId: 3, available: false, search: 'bor' });
    expect(w).toMatchObject({ deletedAt: null, genreId: 1, publisherId: 2, authorId: 3, available: false });
    expect(w.OR).toHaveLength(2);
  });
});

describe('buildBookOrderBy', () => {
  it('orden por defecto', () => {
    expect(buildBookOrderBy()).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
  });

  it('múltiples campos, incluyendo relaciones', () => {
    expect(buildBookOrderBy('genre:asc,price:desc')).toEqual([{ genre: { name: 'asc' } }, { price: 'desc' }, { id: 'asc' }]);
  });
});
