import { Prisma } from '@prisma/client';
import { QueryBooksDto } from './dto/book.dto';

/** Construye el WHERE de Prisma a partir de los filtros. Siempre excluye eliminados (soft delete). */
export function buildBookWhere(q: Partial<QueryBooksDto>): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = { deletedAt: null };
  if (q.genreId) where.genreId = q.genreId;
  if (q.publisherId) where.publisherId = q.publisherId;
  if (q.authorId) where.authorId = q.authorId;
  if (typeof q.available === 'boolean') where.available = q.available;
  if (q.search) {
    where.OR = [
      { title: { contains: q.search, mode: 'insensitive' } },
      { author: { name: { contains: q.search, mode: 'insensitive' } } },
    ];
  }
  return where;
}

const RELATION_FIELDS = ['author', 'publisher', 'genre'];

/** Convierte "genre:asc,price:desc" en un orderBy múltiple de Prisma. */
export function buildBookOrderBy(sort?: string): Prisma.BookOrderByWithRelationInput[] {
  if (!sort) return [{ createdAt: 'desc' }, { id: 'desc' }];
  const order = sort.split(',').map((part) => {
    const [field, dir] = part.split(':') as [string, Prisma.SortOrder];
    return RELATION_FIELDS.includes(field) ? { [field]: { name: dir } } : { [field]: dir };
  });
  // id como desempate garantiza paginación estable
  return [...order, { id: 'asc' }] as Prisma.BookOrderByWithRelationInput[];
}
