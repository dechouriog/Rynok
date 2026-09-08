import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity.js';
import { PropertyService } from './property.service.js';
import { PropertyController } from './property.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Property]), AuthModule],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}