import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { BookDetailPage } from './pages/BookDetailPage';
import { BookFormPage } from './pages/BookFormPage';
import { BooksPage } from './pages/BooksPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<BooksPage />} />
          <Route path="/books/new" element={<BookFormPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/books/:id/edit" element={<BookFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
