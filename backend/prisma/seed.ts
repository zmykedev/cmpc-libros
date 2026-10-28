import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const books = [
  ['Cien años de soledad', 'Gabriel García Márquez', 'Sudamericana', 'Novela', 15990, true],
  ['El amor en los tiempos del cólera', 'Gabriel García Márquez', 'Sudamericana', 'Novela', 13990, true],
  ['La casa de los espíritus', 'Isabel Allende', 'Plaza & Janés', 'Novela', 12990, false],
  ['Veinte poemas de amor', 'Pablo Neruda', 'Nascimento', 'Poesía', 8990, true],
  ['Ficciones', 'Jorge Luis Borges', 'Sur', 'Cuentos', 10990, true],
  ['Rayuela', 'Julio Cortázar', 'Sudamericana', 'Novela', 14990, true],
  ['Sapiens', 'Yuval Noah Harari', 'Debate', 'Historia', 19990, true],
  ['Breve historia del tiempo', 'Stephen Hawking', 'Crítica', 'Ciencia', 16990, false],
  ['El Principito', 'Antoine de Saint-Exupéry', 'Salamandra', 'Infantil', 7990, true],
  ['1984', 'George Orwell', 'Debolsillo', 'Ciencia ficción', 9990, true],
  ['Fahrenheit 451', 'Ray Bradbury', 'Debolsillo', 'Ciencia ficción', 9490, true],
  ['Los detectives salvajes', 'Roberto Bolaño', 'Anagrama', 'Novela', 18990, true],
  ['2666', 'Roberto Bolaño', 'Anagrama', 'Novela', 24990, false],
  ['Hijo de ladrón', 'Manuel Rojas', 'Zig-Zag', 'Novela', 8490, true],
  ['Desolación', 'Gabriela Mistral', 'Zig-Zag', 'Poesía', 7490, true],
] as const;

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@cmpc.cl' },
    update: {},
    create: {
      email: 'admin@cmpc.cl',
      name: 'Administrador',
      passwordHash: await bcrypt.hash('admin123', 10),
    },
  });

  if ((await prisma.book.count()) > 0) return;

  for (const [title, author, publisher, genre, price, available] of books) {
    await prisma.book.create({
      data: {
        title,
        price,
        available,
        author: { connectOrCreate: { where: { name: author }, create: { name: author } } },
        publisher: { connectOrCreate: { where: { name: publisher }, create: { name: publisher } } },
        genre: { connectOrCreate: { where: { name: genre }, create: { name: genre } } },
      },
    });
  }
}

main()
  .then(() => console.log('Seed OK'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
