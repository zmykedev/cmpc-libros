import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const imageUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: 'uploads',
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIME.includes(file.mimetype)
      ? cb(null, true)
      : cb(new BadRequestException('Formato no permitido (jpg, png, webp)'), false),
};
