import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { api, errorMessage, TOKEN_KEY } from './client';
import { cleanParams } from './books';

type Handler = { fulfilled: (v: unknown) => unknown; rejected: (e: unknown) => unknown };
const handlers = (i: unknown) => (i as { handlers: Handler[] }).handlers[0];
const axiosErr = (status?: number, data?: unknown, url = '/books') =>
  new AxiosError('fail', 'ERR', { url, headers: new AxiosHeaders() } as InternalAxiosRequestConfig, null,
    status ? ({ status, data } as never) : undefined);

describe('cliente HTTP', () => {
  beforeEach(() => localStorage.clear());

  it('agrega el token Bearer', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    const cfg = handlers(api.interceptors.request).fulfilled({ headers: new AxiosHeaders() }) as InternalAxiosRequestConfig;
    expect(cfg.headers.Authorization).toBe('Bearer abc');
  });

  it('desempaqueta { success, data }', () => {
    const res = handlers(api.interceptors.response).fulfilled({ data: { success: true, data: [1] } }) as { data: unknown };
    expect(res.data).toEqual([1]);
    const raw = handlers(api.interceptors.response).fulfilled({ data: 'csv' }) as { data: unknown };
    expect(raw.data).toBe('csv');
  });

  it('en 401 borra el token y emite logout', async () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    const spy = vi.fn();
    window.addEventListener('auth:logout', spy);
    await expect(handlers(api.interceptors.response).rejected(axiosErr(401))).rejects.toBeDefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('errorMessage cubre todos los casos', () => {
    expect(errorMessage(axiosErr(400, { message: ['a', 'b'] }))).toBe('a. b');
    expect(errorMessage(axiosErr(404, { message: 'No existe' }))).toBe('No existe');
    expect(errorMessage(axiosErr())).toBe('No se pudo conectar con el servidor');
    expect(errorMessage(new Error('x'))).toBe('x');
    expect(errorMessage('?')).toBe('Error inesperado');
  });

  it('cleanParams elimina vacíos', () => {
    expect(cleanParams({ a: 1, b: '', c: undefined, d: false })).toEqual({ a: 1, d: false });
  });
});
