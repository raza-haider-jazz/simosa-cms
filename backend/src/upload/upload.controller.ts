import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload a file using multipart/form-data
   * POST /upload/file
   */
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const url = await this.uploadService.saveUploadedFile(file);
    return { url };
  }

  /**
   * Convert a base64 data URL to a file and return the URL
   * POST /upload/base64
   * Body: { dataUrl: "data:image/jpeg;base64,..." }
   */
  @Post('base64')
  async uploadBase64(@Body('dataUrl') dataUrl: string) {
    if (!dataUrl) {
      throw new BadRequestException('No dataUrl provided');
    }

    const url = await this.uploadService.saveBase64Image(dataUrl);
    return { url };
  }
}
