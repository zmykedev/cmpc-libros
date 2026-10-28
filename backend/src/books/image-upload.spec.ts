import { BadRequestException } from '@nestjs/common';
import { imageUploadOptions } from './image-upload';

describe('imageUploadOptions.fileFilter', () => {
  const filter = imageUploadOptions.fileFilter!;

  it('acepta imágenes permitidas', () => {
    const cb = jest.fn();
    filter({} as never, { mimetype: 'image/png' } as Express.Multer.File, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rechaza otros formatos', () => {
    const cb = jest.fn();
    filter({} as never, { mimetype: 'application/pdf' } as Express.Multer.File, cb);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(BadRequestException);
    expect(cb.mock.calls[0][1]).toBe(false);
  });
});
