import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark">CMPC<span>-libros</span></Link>
          <button className="btn quiet" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
