import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BooksService } from './books.service';

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Rayuela',
  price: new Prisma.Decimal(14990),
  available: true,
  imageUrl: null,
  authorId: 1,
  publisherId: 1,
  genreId: 1,
  author: { id: 1, name: 'Cortázar' },
  publisher: { id: 1, name: 'Sudamericana' },
  genre: { id: 1, name: 'Novela' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  ...over,
});

function setup() {
  const tx = {
    book: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  };
  const prisma = {
    book: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
    genre: { findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Novela' }]) },
    publisher: { findMany: jest.fn().mockResolvedValue([]) },
    author: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn((arg: unknown) => (typeof arg === 'function' ? arg(tx) : Promise.all(arg as Promise<unknown>[]))),
  };
  const audit = { log: jest.fn() };
  const service = new BooksService(prisma as never, audit as never);
  return { service, prisma, tx, audit };
}

describe('BooksService', () => {
  it('findAll pagina y devuelve meta', async () => {
    const { service, prisma } = setup();
    prisma.book.findMany.mockResolvedValue([row()]);
    prisma.book.count.mockResolvedValue(21);

    const res = await service.findAll({ page: 2, limit: 10, sort: 'price:desc' });

    expect(prisma.book.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    expect(res.meta).toEqual({ total: 21, page: 2, limit: 10, totalPages: 3 });
    expect(res.items[0]).toMatchObject({ title: 'Rayuela', price: 14990, author: { name: 'Cortázar' } });
  });

  it('findOne lanza 404 si no existe', async () => {
    const { service, prisma } = setup();
    prisma.book.findFirst.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne retorna el libro', async () => {
    const { service, prisma } = setup();
    prisma.book.findFirst.mockResolvedValue(row());
    await expect(service.findOne(1)).resolves.toMatchObject({ id: 1 });
  });

  it('create usa connectOrCreate y audita dentro de la transacción', async () => {
    const { service, tx, audit } = setup();
    tx.book.create.mockResolvedValue(row());
    const dto = { title: 'Rayuela', author: 'Cortázar', publisher: 'Sudamericana', genre: 'Novela', price: 14990, available: true };

    await service.create(dto, 7);

    expect(tx.book.create.mock.calls[0][0].data.author).toEqual({
      connectOrCreate: { where: { name: 'Cortázar' }, create: { name: 'Cortázar' } },
    });
    expect(audit.log).toHaveBeenCalledWith(tx, expect.objectContaining({ action: 'CREATE', entityId: 1, userId: 7 }));
  });

  it('update modifica sólo campos enviados y audita', async () => {
    const { service, tx, audit } = setup();
    tx.book.findFirst.mockResolvedValue(row());
    tx.book.update.mockResolvedValue(row({ price: new Prisma.Decimal(100) }));

    const res = await service.update(1, { price: 100, genre: 'Clásico' }, 7);

    const data = tx.book.update.mock.calls[0][0].data;
    expect(data.author).toBeUndefined();
    expect(data.genre.connectOrCreate.where.name).toBe('Clásico');
    expect(res.price).toBe(100);
    expect(audit.log).toHaveBeenCalledWith(tx, expect.objectContaining({ action: 'UPDATE' }));
  });

  it('update con autor y editorial nuevos', async () => {
    const { service, tx } = setup();
    tx.book.findFirst.mockResolvedValue(row());
    tx.book.update.mockResolvedValue(row());
    await service.update(1, { author: 'X', publisher: 'Y' }, 7);
    const data = tx.book.update.mock.calls[0][0].data;
    expect(data.author.connectOrCreate.where.name).toBe('X');
    expect(data.publisher.connectOrCreate.where.name).toBe('Y');
  });

  it('update lanza 404 si el libro fue eliminado', async () => {
    const { service, tx } = setup();
    tx.book.findFirst.mockResolvedValue(null);
    await expect(service.update(1, { price: 1 }, 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.book.update).not.toHaveBeenCalled();
  });

  it('remove hace soft delete', async () => {
    const { service, tx, audit } = setup();
    tx.book.findFirst.mockResolvedValue(row());
    await expect(service.remove(1, 7)).resolves.toEqual({ id: 1, deleted: true });
    expect(tx.book.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { deletedAt: expect.any(Date) } });
    expect(audit.log).toHaveBeenCalledWith(tx, expect.objectContaining({ action: 'DELETE' }));
  });

  it('setImage guarda la url y audita', async () => {
    const { service, tx, audit } = setup();
    tx.book.findFirst.mockResolvedValue(row());
    tx.book.update.mockResolvedValue(row({ imageUrl: '/uploads/a.png' }));
    const res = await service.setImage(1, '/uploads/a.png', 7);
    expect(res.imageUrl).toBe('/uploads/a.png');
    expect(audit.log).toHaveBeenCalledWith(tx, expect.objectContaining({ action: 'UPLOAD_IMAGE' }));
  });

  it('exportCsv genera cabecera y filas', async () => {
    const { service, prisma } = setup();
    prisma.book.findMany.mockResolvedValue([row(), row({ id: 2, available: false })]);
    const csv = await service.exportCsv({});
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('id,titulo,autor,editorial,genero,precio,disponible');
    expect(lines[1]).toBe('1,Rayuela,Cortázar,Sudamericana,Novela,14990,si');
    expect(lines[2]).toMatch(/,no$/);
  });

  it('catalog consulta la tabla correspondiente', async () => {
    const { service, prisma } = setup();
    await expect(service.catalog('genre')).resolves.toEqual([{ id: 1, name: 'Novela' }]);
    await service.catalog('publisher');
    await service.catalog('author');
    expect(prisma.publisher.findMany).toHaveBeenCalled();
    expect(prisma.author.findMany).toHaveBeenCalled();
  });
});
