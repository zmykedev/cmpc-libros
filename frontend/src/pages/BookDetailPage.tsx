import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { booksApi, type Book } from '../api/books';
import { errorMessage } from '../api/client';
import { Alert } from '../components/Alert';
import { formatPrice } from '../utils/sort';

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    booksApi.get(Number(id)).then(setBook).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const remove = async () => {
    if (!book || !window.confirm(`¿Eliminar "${book.title}"?`)) return;
    try {
      await booksApi.remove(book.id);
      navigate('/');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <section>
      <div className="page-head">
        <Link to="/" className="btn ghost">← Volver</Link>
        {book && (
          <div className="actions">
            <Link className="btn" to={`/books/${book.id}/edit`}>Editar</Link>
            <button className="btn danger" onClick={remove}>Eliminar</button>
          </div>
        )}
      </div>
      <Alert message={error} />
      {book && (
        <article className="card detail">
          {book.imageUrl ? <img src={book.imageUrl} alt={book.title} /> : <div className="no-image">Sin imagen</div>}
          <div>
            <h1>{book.title}</h1>
            <dl>
              <dt>Autor</dt><dd>{book.author.name}</dd>
              <dt>Editorial</dt><dd>{book.publisher.name}</dd>
              <dt>Género</dt><dd>{book.genre.name}</dd>
              <dt>Precio</dt><dd>{formatPrice(book.price)}</dd>
              <dt>Disponibilidad</dt><dd>{book.available ? 'Disponible' : 'Agotado'}</dd>
              <dt>Actualizado</dt><dd>{new Date(book.updatedAt).toLocaleString('es-CL')}</dd>
            </dl>
          </div>
        </article>
      )}
    </section>
  );
}
