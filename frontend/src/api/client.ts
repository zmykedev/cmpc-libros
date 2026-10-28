import axios, { AxiosError } from 'axios';

export const TOKEN_KEY = 'cmpc_token';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// La API envuelve todo en { success, data }: lo desempaquetamos aquí para que el resto no lo note.
api.interceptors.response.use(
  (res) => (res.data && typeof res.data === 'object' && 'success' in res.data ? { ...res, data: res.data.data } : res),
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  },
);

/** Extrae un mensaje legible de cualquier error (API, red o JS). */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (msg) return msg;
    if (!error.response) return 'No se pudo conectar con el servidor';
  }
  return error instanceof Error ? error.message : 'Error inesperado';
}
