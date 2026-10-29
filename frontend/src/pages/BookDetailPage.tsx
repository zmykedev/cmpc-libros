import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { booksApi, type Book } from '../api/books';
import { errorMessage } from '../api/client';
import { Alert } from '../components/Alert';
import { formatPrice } from '../utils/sort';

/** "Gabriel García Márquez" → "García Márquez, Gabriel", como en una ficha de catálogo. */
export function catalogName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const first = parts.length > 2 ? parts.slice(0, -2) : parts.slice(0, 1);
  const last = parts.slice(first.length);
  return `${last.join(' ')}, ${first.join(' ')}`;
}

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    booksApi.get(Number(id)).then(setBook).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const remove = async () => {
    if (!book || !window.confirm(`¿Eliminar "${book.title}" del inventario?`)) return;
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
        <Link to="/" className="back">Volver al inventario</Link>
        {book && (
          <div className="actions">
            <Link className="btn" to={`/books/${book.id}/edit`}>Editar</Link>
            <button className="btn danger" onClick={remove}>Eliminar</button>
          </div>
        )}
      </div>
      <Alert message={error} />
      {book && (
        <div className="record">
          <figure className="cover">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={`Portada de ${book.title}`} />
            ) : (
              <div className="cover-blank">
                <strong>{book.title}</strong>
                <span>Sin imagen</span>
              </div>
            )}
          </figure>

          <article className="catalog-card" aria-label="Ficha del libro">
            <header className="card-head">
              <span className="call-no">Nº {String(book.id).padStart(4, '0')}</span>
              <span className="card-author">{catalogName(book.author.name)}</span>
            </header>
            <div className="card-body">
              <h1>{book.title}</h1>
              <p>{book.publisher.name}. {book.genre.name}.</p>
              <dl>
                <dt>Autor</dt><dd>{book.author.name}</dd>
                <dt>Editorial</dt><dd>{book.publisher.name}</dd>
                <dt>Género</dt><dd>{book.genre.name}</dd>
                <dt>Precio</dt><dd>{formatPrice(book.price)}</dd>
                <dt>Estado</dt>
                <dd className={book.available ? 'in' : 'out'}>{book.available ? 'Disponible' : 'Agotado'}</dd>
                <dt>Actualizado</dt><dd>{new Date(book.updatedAt).toLocaleDateString('es-CL')}</dd>
              </dl>
            </div>
            <span className="card-hole" aria-hidden="true" />
          </article>
        </div>
      )}
    </section>
  );
}
