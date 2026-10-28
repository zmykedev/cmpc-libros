import type { ReactNode } from 'react';

interface Props {
  id: string;
  label: string;
  error?: string | null;
  children: ReactNode;
}

/** Etiqueta + control + mensaje de error asociado (accesible vía aria-describedby). */
export function Field({ id, label, error, children }: Props) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      <small id={`${id}-error`} className="error">{error}</small>
    </div>
  );
}
