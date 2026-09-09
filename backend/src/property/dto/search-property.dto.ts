import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class SearchPropertyDto {
  @ApiPropertyOptional({ description: 'Búsqueda parcial por título.', example: 'apartamento' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Búsqueda parcial por ubicación.', example: 'Medellín' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Precio mínimo en ETH.', example: '1' })
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @ApiPropertyOptional({ description: 'Precio máximo en ETH.', example: '5' })
  @IsOptional()
  @IsNumberString()
  maxPrice?: string;
}