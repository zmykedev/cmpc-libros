import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildBookOrderBy, buildBookWhere } from './book-query.builder';
import { toCsv } from './csv.util';
import { CreateBookDto, QueryBooksDto, UpdateBookDto } from './dto/book.dto';

const include = { author: true, publisher: true, genre: true } satisfies Prisma.BookInclude;
type BookWithRelations = Prisma.BookGetPayload<{ include: typeof include }>;

const ENTITY = 'Book';

/** connectOrCreate por nombre único: mantiene el modelo normalizado sin exigir IDs al cliente. */
const byName = (name: string) => ({ connectOrCreate: { where: { name }, create: { name } } });

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(q: QueryBooksDto) {
    const where = buildBookWhere(q);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        include,
        orderBy: buildBookOrderBy(q.sort),
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.book.count({ where }),
    ]);
    return {
      items: items.map(toView),
      meta: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
    };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findFirst({ where: { id, deletedAt: null }, include });
    if (!book) throw new NotFoundException(`Libro ${id} no encontrado`);
    return toView(book);
  }

  async create(dto: CreateBookDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          title: dto.title,
          price: dto.price,
          available: dto.available,
          author: byName(dto.author),
          publisher: byName(dto.publisher),
          genre: byName(dto.genre),
        },
        include,
      });
      await this.audit.log(tx, { action: 'CREATE', entity: ENTITY, entityId: book.id, userId, changes: dto });
      return toView(book);
    });
  }

  async update(id: number, dto: UpdateBookDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const before = await this.getActive(tx, id);
      const book = await tx.book.update({
        where: { id },
        data: {
          title: dto.title,
          price: dto.price,
          available: dto.available,
          author: dto.author ? byName(dto.author) : undefined,
          publisher: dto.publisher ? byName(dto.publisher) : undefined,
          genre: dto.genre ? byName(dto.genre) : undefined,
        },
        include,
      });
      await this.audit.log(tx, {
        action: 'UPDATE',
        entity: ENTITY,
        entityId: id,
        userId,
        changes: { before: toView(before), after: dto },
      });
      return toView(book);
    });
  }

  /** Soft delete: marca deleted_at en lugar de borrar la fila. */
  async remove(id: number, userId: number) {
    await this.prisma.$transaction(async (tx) => {
      await this.getActive(tx, id);
      await tx.book.update({ where: { id }, data: { deletedAt: new Date() } });
      await this.audit.log(tx, { action: 'DELETE', entity: ENTITY, entityId: id, userId });
    });
    return { id, deleted: true };
  }

  async setImage(id: number, imageUrl: string, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.getActive(tx, id);
      const book = await tx.book.update({ where: { id }, data: { imageUrl }, include });
      await this.audit.log(tx, { action: 'UPLOAD_IMAGE', entity: ENTITY, entityId: id, userId, changes: { imageUrl } });
      return toView(book);
    });
  }

  /** Exporta a CSV respetando los mismos filtros/orden del listado (sin paginar). */
  async exportCsv(q: Partial<QueryBooksDto>): Promise<string> {
    const books = await this.prisma.book.findMany({
      where: buildBookWhere(q),
      include,
      orderBy: buildBookOrderBy(q.sort),
    });
    return toCsv(
      ['id', 'titulo', 'autor', 'editorial', 'genero', 'precio', 'disponible'],
      books.map((b) => [b.id, b.title, b.author.name, b.publisher.name, b.genre.name, b.price.toString(), b.available ? 'si' : 'no']),
    );
  }

  catalog(type: 'genre' | 'publisher' | 'author') {
    const args = { orderBy: { name: 'asc' as const }, select: { id: true, name: true } };
    if (type === 'genre') return this.prisma.genre.findMany(args);
    if (type === 'publisher') return this.prisma.publisher.findMany(args);
    return this.prisma.author.findMany(args);
  }

  private async getActive(tx: Prisma.TransactionClient, id: number) {
    const book = await tx.book.findFirst({ where: { id, deletedAt: null }, include });
    if (!book) throw new NotFoundException(`Libro ${id} no encontrado`);
    return book;
  }
}

export function toView(b: BookWithRelations) {
  return {
    id: b.id,
    title: b.title,
    price: Number(b.price),
    available: b.available,
    imageUrl: b.imageUrl,
    author: { id: b.author.id, name: b.author.name },
    publisher: { id: b.publisher.id, name: b.publisher.name },
    genre: { id: b.genre.id, name: b.genre.name },
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}
