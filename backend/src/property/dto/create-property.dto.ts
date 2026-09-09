import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsNumberString()
  priceEth: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/casa.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}