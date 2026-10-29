import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';

const schema = z.object({
  email: z.email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormValues = z.infer<typeof schema>;

export const DEMO = { email: 'admin@cmpc.cl', password: 'admin123' };

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setValue } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onTouched' });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (v: FormValues) => {
    setError(null);
    try {
      await login(v.email, v.password);
      navigate('/');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="login">
      <div className="login-brand">
        <p className="wordmark big">CMPC<span>-libros</span></p>
        <p className="login-lede">Inventario de la tienda: busca, registra y actualiza cada libro del catálogo.</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>Iniciar sesión</h1>
        <Alert message={error} />
        <Field id="email" label="Correo" error={formState.errors.email?.message}>
          <input id="email" type="email" autoComplete="username" {...register('email')} />
        </Field>
        <Field id="password" label="Contraseña" error={formState.errors.password?.message}>
          <input id="password" type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <button className="btn primary block" type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </button>
        <aside className="demo" aria-label="Usuario de prueba">
          <p>
            Usuario de prueba: <strong>{DEMO.email}</strong> / <strong>{DEMO.password}</strong>
          </p>
          <button
            type="button"
            className="btn quiet"
            onClick={() => {
              setValue('email', DEMO.email, { shouldValidate: true });
              setValue('password', DEMO.password, { shouldValidate: true });
            }}
          >
            Completar con el usuario de prueba
          </button>
        </aside>
      </form>
    </div>
  );
}
