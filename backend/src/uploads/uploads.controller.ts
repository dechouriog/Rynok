import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WalletAuthGuard } from '../auth/wallet-auth.guard.js';
import { MAX_IMAGE_BYTES, UploadsService, type UploadedImage } from './uploads.service.js';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('images')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Subir una imagen de propiedad (JPG, PNG, WebP o GIF, máx. 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Devuelve { url } para usar como imageUrl de la propiedad.' })
  @UseGuards(WalletAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(@UploadedFile() file: UploadedImage) {
    return this.uploads.saveImage(file);
  }
}
