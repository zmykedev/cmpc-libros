import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { booksApi, type Catalogs } from '../api/books';
import { errorMessage } from '../api/client';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';

export const MAX_IMAGE_MB = 2;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label} es obligatorio`).max(max, `Máximo ${max} caracteres`);

export const bookSchema = z.object({
  title: text('El título', 200),
  author: text('El autor', 120),
  publisher: text('La editorial', 120),
  genre: text('El género', 60),
  price: z.number({ error: 'Ingresa un precio válido' }).min(0, 'El precio no puede ser negativo').max(99_999_999, 'Precio demasiado alto'),
  available: z.boolean(),
});
type FormValues = z.infer<typeof bookSchema>;

export function validateImage(file: File | undefined): string | null {
  if (!file) return null;
  if (!IMAGE_TYPES.includes(file.type)) return 'Formato no permitido (jpg, png, webp)';
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `La imagen supera ${MAX_IMAGE_MB} MB`;
  return null;
}

export function BookFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<File>();
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<Catalogs>({ genres: [], publishers: [], authors: [] });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isValid } } = useForm<FormValues>({
    resolver: zodResolver(bookSchema),
    mode: 'onChange', // validación reactiva mientras se escribe
    defaultValues: { title: '', author: '', publisher: '', genre: '', price: 0, available: true },
  });

  useEffect(() => {
    booksApi.catalogs().then(setCatalogs).catch(() => undefined);
    if (!id) return;
    booksApi
      .get(Number(id))
      .then((b) => {
        reset({ title: b.title, author: b.author.name, publisher: b.publisher.name, genre: b.genre.name, price: b.price, available: b.available });
        setPreview(b.imageUrl);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [id, reset]);

  const onImage = (file: File | undefined) => {
    const err = validateImage(file);
    setImageError(err);
    setImage(err ? undefined : file);
    if (file && !err) setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const book = isEdit ? await booksApi.update(Number(id), values) : await booksApi.create(values);
      if (image) await booksApi.uploadImage(book.id, image);
      navigate(`/books/${book.id}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const datalist = (key: keyof Catalogs) => (
    <datalist id={`dl-${key}`}>{catalogs[key].map((i) => <option key={i.id} value={i.name} />)}</datalist>
  );

  return (
    <section className="form-page">
      <div className="page-head">
        <h1>{isEdit ? 'Editar libro' : 'Agregar libro'}</h1>
      </div>
      <form className="book-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Alert message={error} />
        <div className="form-grid">
          <div className="span-2">
            <Field id="title" label="Título" error={errors.title?.message}>
              <input id="title" aria-invalid={!!errors.title} {...register('title')} />
            </Field>
          </div>
          <Field id="author" label="Autor" error={errors.author?.message}>
            <input id="author" list="dl-authors" placeholder="Nombre y apellido" aria-invalid={!!errors.author} {...register('author')} />
          </Field>
          <Field id="publisher" label="Editorial" error={errors.publisher?.message}>
            <input id="publisher" list="dl-publishers" aria-invalid={!!errors.publisher} {...register('publisher')} />
          </Field>
          <Field id="genre" label="Género" error={errors.genre?.message}>
            <input id="genre" list="dl-genres" aria-invalid={!!errors.genre} {...register('genre')} />
          </Field>
          <Field id="price" label="Precio (CLP)" error={errors.price?.message}>
            <input id="price" type="number" step="1" min="0" inputMode="numeric" aria-invalid={!!errors.price} {...register('price', { valueAsNumber: true })} />
          </Field>
          <label className="check span-2">
            <input type="checkbox" {...register('available')} />
            <span>Disponible para la venta</span>
          </label>
        </div>

        <div className="image-row">
          <div className="thumb">
            {preview ? <img src={preview} alt="Vista previa" /> : <span>Sin portada</span>}
          </div>
          <Field id="image" label={`Portada (jpg, png o webp, máx. ${MAX_IMAGE_MB} MB)`} error={imageError}>
            <input id="image" type="file" accept={IMAGE_TYPES.join(',')} onChange={(e) => onImage(e.target.files?.[0])} />
          </Field>
        </div>

        {datalist('authors')}
        {datalist('publishers')}
        {datalist('genres')}

        <div className="form-actions">
          <Link to={isEdit ? `/books/${id}` : '/'} className="btn quiet">Cancelar</Link>
          <button className="btn primary" type="submit" disabled={isSubmitting || !isValid}>
            {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear libro'}
          </button>
        </div>
      </form>
    </section>
  );
}
