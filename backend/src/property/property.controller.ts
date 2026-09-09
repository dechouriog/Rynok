import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
    summary: 'Listar o buscar propiedades',
    description: 'Sin filtros devuelve todas las propiedades. Con `q`, `location`, `minPrice` y/o `maxPrice` aplica búsqueda.',
  })
  @ApiResponse({ status: 200, description: 'Lista de propiedades.' })
  findAll(@Query() filters: SearchPropertyDto) {
    const hasFilters = Object.values(filters).some(Boolean);
    return hasFilters ? this.service.search(filters) : this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver el detalle de una propiedad' })
  @ApiParam({ name: 'id', description: 'UUID de la propiedad' })
  @ApiResponse({ status: 200, description: 'Detalle de la propiedad.' })
  @ApiNotFoundResponse({ description: 'No existe una propiedad con ese id.' })
  findOne(@Param('id') id: string) {
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
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @CurrentUser() user: { sub: string }) {
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
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.remove(id, user.sub);
  }
}