import {
  BadRequestException, Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Query,
  StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BooksService } from './books.service';
import { CreateBookDto, QueryBooksDto, UpdateBookDto } from './dto/book.dto';
import { imageUploadOptions } from './image-upload';

@ApiTags('books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get('books')
  findAll(@Query() query: QueryBooksDto) {
    return this.books.findAll(query);
  }

  @Get('books/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="libros.csv"')
  async export(@Query() query: QueryBooksDto) {
    // BOM para que Excel reconozca UTF-8 (tildes, ñ)
    return new StreamableFile(Buffer.from('﻿' + (await this.books.exportCsv(query)), 'utf-8'));
  }

  @Get('books/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.books.findOne(id);
  }

  @Post('books')
  create(@Body() dto: CreateBookDto, @CurrentUser() user: AuthUser) {
    return this.books.create(dto, user.id);
  }

  @Patch('books/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto, @CurrentUser() user: AuthUser) {
    return this.books.update(id, dto, user.id);
  }

  @Delete('books/:id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.books.remove(id, user.id);
  }

  @Post('books/:id/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar una imagen en el campo "file"');
    return this.books.setImage(id, `/uploads/${file.filename}`, user.id);
  }

  @Get('genres')
  genres() {
    return this.books.catalog('genre');
  }

  @Get('publishers')
  publishers() {
    return this.books.catalog('publisher');
  }

  @Get('authors')
  authors() {
    return this.books.catalog('author');
  }
}
