import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toBool = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

export class CreateBookDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(1) @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Nombre del autor (se crea si no existe)' })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(120)
  author: string;

  @ApiProperty({ description: 'Nombre de la editorial (se crea si no existe)' })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(120)
  publisher: string;

  @ApiProperty({ description: 'Nombre del género (se crea si no existe)' })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(60)
  genre: string;

  @ApiProperty({ example: 12990 }) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(99999999)
  price: number;

  @ApiProperty() @IsBoolean()
  available: boolean;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export const SORTABLE_FIELDS = ['title', 'price', 'createdAt', 'available', 'author', 'publisher', 'genre'] as const;

export class QueryBooksDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 10;

  @ApiPropertyOptional({ description: 'Busca en título y autor' }) @IsOptional() @Transform(trim) @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt()
  genreId?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt()
  publisherId?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt()
  authorId?: number;

  @ApiPropertyOptional() @IsOptional() @Transform(toBool) @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({ example: 'genre:asc,price:desc', description: `Campos: ${SORTABLE_FIELDS.join(', ')}` })
  @IsOptional()
  @Matches(new RegExp(`^((${SORTABLE_FIELDS.join('|')}):(asc|desc))(,(${SORTABLE_FIELDS.join('|')}):(asc|desc))*$`), {
    message: 'sort inválido. Formato: campo:asc|desc separados por coma',
  })
  sort?: string;
}

