import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'uploads'), serveRoot: '/uploads' }),
    PrismaModule,
    AuditModule,
    AuthModule,
    BooksModule,
  ],
})
export class AppModule {}
