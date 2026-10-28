export function Alert({ message }: { message: string | null }) {
  if (!message) return null;
  return <div role="alert" className="alert">{message}</div>;
}
