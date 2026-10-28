import { BadRequestException, StreamableFile } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

describe('BooksController', () => {
  let controller: BooksController;
  const service = {
    findAll: jest.fn().mockResolvedValue({ items: [], meta: {} }),
    findOne: jest.fn().mockResolvedValue({ id: 1 }),
    create: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    remove: jest.fn().mockResolvedValue({ id: 1, deleted: true }),
    setImage: jest.fn().mockResolvedValue({ id: 1, imageUrl: '/uploads/f.png' }),
    exportCsv: jest.fn().mockResolvedValue('a,b'),
    catalog: jest.fn().mockResolvedValue([]),
  };
  const user = { id: 7, email: 'a@b.cl' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [{ provide: BooksService, useValue: service }],
    }).compile();
    controller = mod.get(BooksController);
  });

  it('delega listado, detalle y CRUD al servicio', async () => {
    const q = { page: 1, limit: 10 };
    await controller.findAll(q);
    await controller.findOne(1);
    const dto = { title: 't', author: 'a', publisher: 'p', genre: 'g', price: 1, available: true };
    await controller.create(dto, user);
    await controller.update(1, { price: 2 }, user);
    await controller.remove(1, user);

    expect(service.findAll).toHaveBeenCalledWith(q);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(service.create).toHaveBeenCalledWith(dto, 7);
    expect(service.update).toHaveBeenCalledWith(1, { price: 2 }, 7);
    expect(service.remove).toHaveBeenCalledWith(1, 7);
  });

  it('export devuelve un StreamableFile con BOM', async () => {
    const file = await controller.export({ page: 1, limit: 10 });
    expect(file).toBeInstanceOf(StreamableFile);
  });

  it('uploadImage exige archivo', () => {
    expect(() => controller.uploadImage(1, undefined, user)).toThrow(BadRequestException);
  });

  it('uploadImage guarda la ruta pública', async () => {
    await controller.uploadImage(1, { filename: 'f.png' } as Express.Multer.File, user);
    expect(service.setImage).toHaveBeenCalledWith(1, '/uploads/f.png', 7);
  });

  it('endpoints de catálogo', async () => {
    await controller.genres();
    await controller.publishers();
    await controller.authors();
    expect(service.catalog.mock.calls.map((c) => c[0])).toEqual(['genre', 'publisher', 'author']);
  });
});
