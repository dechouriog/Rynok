import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Positivo, con máximo 6 decimales (precisión de la columna) y como máximo 7 dígitos enteros. */
export const PRICE_ETH_PATTERN = /^(?!0+(\.0+)?$)\d{1,7}(\.\d{1,6})?$/;
/** URL http(s) o imagen subida a Rynok (POST /uploads/images). Cadena vacía = sin imagen. */
export const IMAGE_URL_PATTERN = /^(https?:\/\/\S+|\/uploads\/[\w-]+\.(jpg|png|gif|webp))$|^$/;

export class CreatePropertyDto {
  @ApiProperty({ example: 'Apartamento moderno en El Poblado', minLength: 5, maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(120, { message: 'El título no puede superar 120 caracteres' })
  title: string;

  @ApiProperty({ example: 'Apartamento de 3 habitaciones, vista panorámica, cerca al metro.', maxLength: 2000 })
  @Transform(trim)
  @IsString()
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  description: string;

  @ApiProperty({ example: 'Medellín, Colombia', maxLength: 120 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  @MaxLength(120, { message: 'La ubicación no puede superar 120 caracteres' })
  location: string;

  @ApiProperty({ example: '3.5', description: 'Precio en ETH, como string para evitar errores de precisión.' })
  @Transform(trim)
  @IsString()
  @Matches(PRICE_ETH_PATTERN, { message: 'El precio debe ser un número mayor que 0 con hasta 6 decimales' })
  priceEth: string;

  @ApiPropertyOptional({
    example: '/uploads/3f2b6c1e-....jpg',
    description: 'URL devuelta por POST /uploads/images, o una URL externa http(s).',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  @Matches(IMAGE_URL_PATTERN, { message: 'La imagen debe ser una URL http(s) o una imagen subida a Rynok' })
  imageUrl?: string;
}
