import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">CMPC-libros</Link>
        <button className="btn ghost" onClick={logout}>Cerrar sesión</button>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
