import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Apartamento moderno en El Poblado', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Apartamento de 3 habitaciones, vista panorámica, cerca al metro.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Medellín, Colombia' })
  @IsString()
  location: string;

  @ApiProperty({ example: '3.5', description: 'Precio en ETH, como string para evitar errores de precisión.' })
  // Positivo y con máximo 6 decimales (precisión de la columna en la base de datos).
  @Matches(/^(?!0+(\.0+)?$)\d+(\.\d{1,6})?$/, {
    message: 'priceEth debe ser un número mayor a cero con máximo 6 decimales',
  })
  priceEth: string;

  @ApiPropertyOptional({
    example: '/uploads/3f2b6c1e-....jpg',
    description: 'URL devuelta por POST /uploads/images, o una URL externa http(s).',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/\S+|\/uploads\/[\w-]+\.(jpg|png|gif|webp))$|^$/, {
    message: 'imageUrl debe ser una URL http(s) o una imagen subida a Rynok',
  })
  imageUrl?: string;
}