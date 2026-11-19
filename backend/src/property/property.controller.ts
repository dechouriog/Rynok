import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PropertyService } from './property.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { SearchPropertyDto } from './dto/search-property.dto.js';
import { WalletAuthGuard } from '../auth/wallet-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly service: PropertyService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publicar una propiedad nueva (requiere wallet conectada)' })
  @ApiResponse({ status: 201, description: 'Propiedad creada, asociada al usuario autenticado como owner.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @UseGuards(WalletAuthGuard)
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: { sub: string }) {
    return this.service.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar o buscar propiedades (paginado)',
    description:
      'Filtros opcionales: `q` (título o ubicación), `location`, `minPrice`, `maxPrice`, `status`. ' +
      'Orden con `sort` (recent, price_asc, price_desc) y paginación con `page` y `limit` (máx. 50).',
  })
  @ApiResponse({
    status: 200,
    description: '{ items, total, page, limit, totalPages }',
    schema: { example: { items: [], total: 0, page: 1, limit: 12, totalPages: 1 } },
  })
  findAll(@Query() filters: SearchPropertyDto) {
    return this.service.search(filters);
  }

  @Get('mine')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Propiedades publicadas por la wallet autenticada' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @UseGuards(WalletAuthGuard)
  findMine(@CurrentUser() user: { sub: string }) {
    return this.service.findByOwner(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de una propiedad' })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiResponse({ status: 200, description: 'Detalle de la propiedad.' })
  @ApiNotFoundResponse({ description: 'No existe una propiedad con ese id.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Editar una propiedad (solo el propietario)' })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiResponse({ status: 200, description: 'Propiedad actualizada.' })
  @ApiForbiddenResponse({ description: 'El usuario autenticado no es el propietario.' })
  @ApiNotFoundResponse({ description: 'No existe una propiedad con ese id.' })
  @UseGuards(WalletAuthGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePropertyDto, @CurrentUser() user: { sub: string }) {
    return this.service.update(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Eliminar una propiedad (solo el propietario)' })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiResponse({ status: 200, description: 'Propiedad eliminada.' })
  @ApiForbiddenResponse({ description: 'El usuario autenticado no es el propietario.' })
  @ApiNotFoundResponse({ description: 'No existe una propiedad con ese id.' })
  @UseGuards(WalletAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { sub: string }) {
    return this.service.remove(id, user.sub);
  }
}
