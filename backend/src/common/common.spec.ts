import { BadRequestException, CallHandler, ExecutionContext, StreamableFile } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { lastValueFrom, of, throwError } from 'rxjs';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';

const ctx = {
  switchToHttp: () => ({ getRequest: () => ({ method: 'GET', url: '/x', user: { email: 'a@b.cl' } }) }),
} as ExecutionContext;
const handler = (value: unknown): CallHandler => ({ handle: () => of(value) });

describe('TransformInterceptor', () => {
  it('envuelve la respuesta', async () => {
    const res = await lastValueFrom(new TransformInterceptor().intercept(ctx, handler({ a: 1 })));
    expect(res).toMatchObject({ success: true, data: { a: 1 } });
  });

  it('no toca archivos', async () => {
    const file = new StreamableFile(Buffer.from('x'));
    expect(await lastValueFrom(new TransformInterceptor().intercept(ctx, handler(file)))).toBe(file);
  });
});

describe('LoggingInterceptor', () => {
  it('deja pasar respuestas y errores', async () => {
    const i = new LoggingInterceptor();
    await expect(lastValueFrom(i.intercept(ctx, handler(1)))).resolves.toBe(1);
    await expect(lastValueFrom(i.intercept(ctx, { handle: () => throwError(() => new Error('boom')) }))).rejects.toThrow('boom');
  });
});

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ url: '/api/x' }) }) } as never;
  const prismaErr = (code: string) => new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: '6' });

  it('formatea HttpException', () => {
    filter.catch(new BadRequestException(['campo inválido']), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: ['campo inválido'], path: '/api/x' }));
  });

  it('mapea errores de Prisma y desconocidos', () => {
    expect(filter.resolve(prismaErr('P2025')).status).toBe(404);
    expect(filter.resolve(prismaErr('P2002')).status).toBe(409);
    expect(filter.resolve(prismaErr('P9999')).status).toBe(500);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    filter.catch(new Error('x'), host);
    expect(status).toHaveBeenLastCalledWith(500);
  });

  it('acepta HttpException con mensaje string', () => {
    expect(filter.resolve(new BadRequestException()).message).toBe('Bad Request');
  });
});
