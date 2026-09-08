import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PropertyService } from './property.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { SearchPropertyDto } from './dto/search-property.dto.js';
import { WalletAuthGuard } from '../auth/wallet-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('properties')
export class PropertyController {
  constructor(private readonly service: PropertyService) {}

  @Post()
  @UseGuards(WalletAuthGuard)
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: { sub: string }) {
    return this.service.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() filters: SearchPropertyDto) {
    const hasFilters = Object.values(filters).some(Boolean);
    return hasFilters ? this.service.search(filters) : this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(WalletAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @CurrentUser() user: { sub: string }) {
    return this.service.update(id, dto, user.sub);
  }

  @Delete(':id')
  @UseGuards(WalletAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.remove(id, user.sub);
  }
}